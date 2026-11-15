$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3001"

# IDs dos registros de teste já existentes
$avisoIndividualId = "613d915f-c0e3-4960-84f4-75cdc8b77925"
$avisoProfessorId = "0f092482-6b55-4368-b37b-4971ffb1d992"
$turmaProfessor2Id = "8a77ea82-3d9c-4ed0-87bd-07cc8bc168c5"

$resultados = @()

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers,
        $Body = $null
    )

    $request = @{
        Uri = "$baseUrl$Path"
        Method = $Method
        ErrorAction = "Stop"
    }

    if ($Headers) {
        $request.Headers = $Headers
    }

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 10
        $request.ContentType = "application/json; charset=utf-8"
        $request.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
    }

    try {
        $data = Invoke-RestMethod @request

        return [PSCustomObject]@{
            Ok = $true
            StatusCode = 200
            Data = $data
            Error = $null
        }
    }
    catch {
        $status = 0
        $message = $_.ErrorDetails.Message

        if ($_.Exception.Response) {
            try {
                $status = [int]$_.Exception.Response.StatusCode
            }
            catch {}

            if (-not $message) {
                try {
                    $reader = New-Object System.IO.StreamReader(
                        $_.Exception.Response.GetResponseStream()
                    )
                    $message = $reader.ReadToEnd()
                    $reader.Dispose()
                }
                catch {}
            }
        }

        return [PSCustomObject]@{
            Ok = $false
            StatusCode = $status
            Data = $null
            Error = $message
        }
    }
}

function Fazer-Login {
    param(
        [string]$Email,
        [string]$Perfil
    )

    Write-Host ""
    $senhaSegura = Read-Host "Digite a senha de $Email" -AsSecureString
    $senha = [System.Net.NetworkCredential]::new("", $senhaSegura).Password

    $resposta = Invoke-Api `
        -Method "POST" `
        -Path "/api/auth/login" `
        -Body @{
            email = $Email
            password = $senha
        }

    $senha = $null

    if (-not $resposta.Ok) {
        throw "Falha na requisição de login para $Email. HTTP: $($resposta.StatusCode). Resposta: $($resposta.Error)"
    }
    
    if ([string]::IsNullOrWhiteSpace([string]$resposta.Data.token)) {
        throw "Login sem token para $Email. Verifique o formato da resposta da API."
    }

    if ($resposta.Data.usuario.role -ne $Perfil) {
        throw "A conta $Email não possui o perfil esperado: $Perfil."
    }

    Write-Host "Login confirmado: $Email" -ForegroundColor Green

    return @{
        Authorization = "Bearer $($resposta.Data.token)"
    }
}

function Registrar-Teste {
    param(
        [string]$Nome,
        [bool]$Aprovado,
        [string]$Detalhe
    )

    $script:resultados += [PSCustomObject]@{
        Teste = $Nome
        Resultado = if ($Aprovado) { "APROVADO" } else { "REPROVADO" }
        Detalhe = $Detalhe
    }

    if ($Aprovado) {
        Write-Host "[APROVADO] $Nome" -ForegroundColor Green
    }
    else {
        Write-Host "[REPROVADO] $Nome - $Detalhe" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================"
Write-Host "     TESTES AUTOMATIZADOS - COMUNICADOS"
Write-Host "============================================"

try {
    # 1. Login das contas
    $headersAluno = Fazer-Login `
        -Email "aluno.teste@syntesis.com" `
        -Perfil "ALUNO"

    $headersProfessor1 = Fazer-Login `
        -Email "prof01@syntesis.com" `
        -Perfil "PROFESSOR"

    $headersProfessor2 = Fazer-Login `
        -Email "prof02@syntesis.com" `
        -Perfil "PROFESSOR"

    # 2. Outro aluno não deve receber o aviso individual do Joãozinho
    $consultaIndividual = Invoke-Api `
        -Method "GET" `
        -Path "/api/announcements/received?categoria=INDIVIDUAL" `
        -Headers $headersAluno

    $listaIndividual = @($consultaIndividual.Data)

    $encontrouAviso = $false

    foreach ($aviso in $listaIndividual) {
        if ($aviso.id -eq $avisoIndividualId) {
            $encontrouAviso = $true
        }
    }

    Registrar-Teste `
        -Nome "Isolamento de comunicados entre alunos" `
        -Aprovado ($consultaIndividual.Ok -and -not $encontrouAviso) `
        -Detalhe "O outro aluno não deve receber o aviso privado do Joãozinho."

    # 3. Outro aluno não pode marcar o aviso privado como lido
    $tentativaLeitura = Invoke-Api `
        -Method "PATCH" `
        -Path "/api/announcements/$avisoIndividualId/read" `
        -Headers $headersAluno

    Registrar-Teste `
        -Nome "Bloqueio de leitura de aviso alheio" `
        -Aprovado (-not $tentativaLeitura.Ok -and $tentativaLeitura.StatusCode -ge 400) `
        -Detalhe "A API deve negar o acesso ao aviso de outro aluno."

    # 4. Professor 2 cria um comunicado temporário para os testes
    $criacao = Invoke-Api `
        -Method "POST" `
        -Path "/api/announcements" `
        -Headers $headersProfessor2 `
        -Body @{
            title = "TESTE AUTOMATIZADO - COMUNICADO TEMPORÁRIO"
            content = "Comunicado criado pelo script de testes."
            targetType = "TODAS_TURMAS"
        }

    if (-not $criacao.Ok -or -not $criacao.Data.comunicado.id) {
        throw "Não foi possível criar o comunicado temporário para os testes."
    }

    $comunicadoTemporarioId = $criacao.Data.comunicado.id

    Write-Host "Comunicado temporário criado." -ForegroundColor Cyan

    # 5. Professor 2 desativa seu próprio comunicado
    $desativacao = Invoke-Api `
        -Method "PUT" `
        -Path "/api/announcements/$comunicadoTemporarioId" `
        -Headers $headersProfessor2 `
        -Body @{
            isActive = $false
        }

    $consultaDesativado = Invoke-Api `
        -Method "GET" `
        -Path "/api/announcements" `
        -Headers $headersProfessor2

    $avisoDesativado = @($consultaDesativado.Data) |
        Where-Object { $_.id -eq $comunicadoTemporarioId } |
        Select-Object -First 1

    Registrar-Teste `
        -Nome "Desativação de comunicado" `
        -Aprovado (
            $desativacao.Ok -and
            $consultaDesativado.Ok -and
            $null -ne $avisoDesativado -and
            $avisoDesativado.isActive -eq $false
        ) `
        -Detalhe "O comunicado deve permanecer cadastrado, mas desativado."

    # 6. Professor 2 reativa seu próprio comunicado
    $reativacao = Invoke-Api `
        -Method "PUT" `
        -Path "/api/announcements/$comunicadoTemporarioId" `
        -Headers $headersProfessor2 `
        -Body @{
            isActive = $true
        }

    $consultaReativado = Invoke-Api `
        -Method "GET" `
        -Path "/api/announcements" `
        -Headers $headersProfessor2

    $avisoReativado = @($consultaReativado.Data) |
        Where-Object { $_.id -eq $comunicadoTemporarioId } |
        Select-Object -First 1

    Registrar-Teste `
        -Nome "Reativação de comunicado" `
        -Aprovado (
            $reativacao.Ok -and
            $consultaReativado.Ok -and
            $null -ne $avisoReativado -and
            $avisoReativado.isActive -eq $true
        ) `
        -Detalhe "O comunicado deve voltar a ficar ativo."

    # 5. Professor 1 não pode editar comunicado do professor 2
    $tentativaEdicao = Invoke-Api `
        -Method "PUT" `
        -Path "/api/announcements/$comunicadoTemporarioId" `
        -Headers $headersProfessor1 `
        -Body @{
            title = "TESTE AUTOMATIZADO - COMUNICADO TEMPORÁRIO"
            content = "Comunicado criado pelo script de testes."
        }

    Registrar-Teste `
        -Nome "Proteção contra edição por outro professor" `
        -Aprovado (-not $tentativaEdicao.Ok -and $tentativaEdicao.StatusCode -ge 400) `
        -Detalhe "Professor 1 não deve editar comunicado do professor 2."

    # 6. Professor 1 não pode excluir comunicado do professor 2
    $tentativaExclusao = Invoke-Api `
        -Method "DELETE" `
        -Path "/api/announcements/$comunicadoTemporarioId" `
        -Headers $headersProfessor1

    Registrar-Teste `
        -Nome "Proteção contra exclusão por outro professor" `
        -Aprovado (-not $tentativaExclusao.Ok -and $tentativaExclusao.StatusCode -ge 400) `
        -Detalhe "Professor 1 não deve excluir comunicado do professor 2."

    # 7. Professor 1 não pode publicar para turma do professor 2
    $tentativaTurma = Invoke-Api `
        -Method "POST" `
        -Path "/api/announcements" `
        -Headers $headersProfessor1 `
        -Body @{
            title = "TESTE DE ACESSO INDEVIDO"
            content = "Este comunicado não deve ser publicado."
            targetType = "TURMA"
            classId = $turmaProfessor2Id
        }

    Registrar-Teste `
        -Nome "Proteção contra envio para turma de outro professor" `
        -Aprovado (-not $tentativaTurma.Ok -and $tentativaTurma.StatusCode -ge 400) `
        -Detalhe "Professor 1 não deve publicar para turma do professor 2."

    # 8. Limpeza: professor 2 exclui seu próprio comunicado temporário
    $limpeza = Invoke-Api `
        -Method "DELETE" `
        -Path "/api/announcements/$comunicadoTemporarioId" `
        -Headers $headersProfessor2

    Registrar-Teste `
        -Nome "Limpeza do comunicado temporário" `
        -Aprovado $limpeza.Ok `
        -Detalhe "O comunicado temporário deve ser excluído pelo próprio autor."
}
catch {
    Write-Host ""
    Write-Host "ERRO DURANTE A EXECUÇÃO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================"
Write-Host "             RELATORIO FINAL"
Write-Host "============================================"

$resultados | Format-Table -AutoSize

$aprovados = @($resultados | Where-Object { $_.Resultado -eq "APROVADO" }).Count
$reprovados = @($resultados | Where-Object { $_.Resultado -eq "REPROVADO" }).Count

Write-Host ""
Write-Host "Aprovados: $aprovados"
Write-Host "Reprovados: $reprovados"
Write-Host "Total: $($resultados.Count)"