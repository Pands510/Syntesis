
import PDFDocument from "pdfkit";

const LEFT = 50;
const RIGHT = 545;
const CONTENT_WIDTH = RIGHT - LEFT;
const BOTTOM_LIMIT = 802;

function formatDate(date) {
  if (!date) return "Não informado";

  return new Date(date).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function drawSectionTitle(doc, title) {
  const y = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#183B66")
    .text(title.toUpperCase(), LEFT, y);

  const lineY = y + 17;

  doc
    .strokeColor("#D5DFEA")
    .lineWidth(1)
    .moveTo(LEFT, lineY)
    .lineTo(RIGHT, lineY)
    .stroke();

  doc.y = lineY + 9;
}

function drawField(doc, label, value, x, y, width = 240) {
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#526174")
    .text(label, x, y, { width });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#172B45")
    .text(String(value ?? "Não informado"), x, y + 12, {
      width,
      ellipsis: true
    });
}

function ensureSpace(doc, requiredHeight = 45) {
  if (doc.y + requiredHeight > BOTTOM_LIMIT) {
    doc.addPage();
    doc.y = 40;
  }
}

export function generateEnrollmentProofPdf(data) {
  const {
    student,
    academicTerm,
    enrollments,
    totalWorkload,
    issuedAt
  } = data;

  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 35,
      bottom: 40,
      left: LEFT,
      right: 50
    },
    info: {
      Title: "Comprovante de Matrícula",
      Author: "Syntesis - Sistema de Educação",
      Subject: "Comprovante de matrícula acadêmica"
    }
  });

  // Cabeçalho institucional.
  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor("#183B66")
    .text("SYNTESIS", LEFT, 35, {
      width: CONTENT_WIDTH,
      align: "center"
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#526174")
    .text("SISTEMA DE EDUCAÇÃO", LEFT, 59, {
      width: CONTENT_WIDTH,
      align: "center"
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#172B45")
    .text("COMPROVANTE DE MATRÍCULA", LEFT, 83, {
      width: CONTENT_WIDTH,
      align: "center"
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#526174")
    .text(
      "Documento de comprovação de vínculo acadêmico",
      LEFT,
      104,
      {
        width: CONTENT_WIDTH,
        align: "center"
      }
    );

  doc.y = 127;

  // Identificação do aluno.
  drawSectionTitle(doc, "Identificação do aluno");

  const studentY = doc.y;

  drawField(
    doc,
    "Nome completo",
    student.user?.name,
    LEFT,
    studentY,
    CONTENT_WIDTH
  );

  drawField(
    doc,
    "Número de matrícula",
    student.registrationNumber,
    LEFT,
    studentY + 35
  );

  drawField(
    doc,
    "Situação acadêmica",
    "ATIVO",
    310,
    studentY + 35
  );

  doc.y = studentY + 65;

  // Dados acadêmicos.
  drawSectionTitle(doc, "Dados acadêmicos");

  const courseY = doc.y;

  drawField(
    doc,
    "Curso",
    student.academicCourse.name,
    LEFT,
    courseY,
    CONTENT_WIDTH
  );

  drawField(
    doc,
    "Código do curso",
    student.academicCourse.code,
    LEFT,
    courseY + 35
  );

  drawField(
    doc,
    "Semestre curricular",
    student.semester
      ? `${student.semester}º semestre`
      : "Não informado",
    310,
    courseY + 35
  );

  doc.y = courseY + 65;

  // Período letivo.
  drawSectionTitle(doc, "Período letivo");

  const termY = doc.y;

  drawField(
    doc,
    "Período",
    academicTerm.name,
    LEFT,
    termY,
    CONTENT_WIDTH
  );

  drawField(
    doc,
    "Ano",
    academicTerm.year,
    LEFT,
    termY + 35,
    70
  );

  drawField(
    doc,
    "Número do período",
    `${academicTerm.termNumber}º período`,
    140,
    termY + 35,
    100
  );

  drawField(
    doc,
    "Data de início",
    formatDate(academicTerm.startDate),
    270,
    termY + 35,
    110
  );

  drawField(
    doc,
    "Data de término",
    formatDate(academicTerm.endDate),
    410,
    termY + 35,
    125
  );

  doc.y = termY + 65;

  // Disciplinas matriculadas.
  drawSectionTitle(doc, "Disciplinas com matrícula ativa");

  const tableX = LEFT;
  const tableWidth = CONTENT_WIDTH;
  const rowHeight = 25;

  function drawTableHeader() {
    const y = doc.y;

    doc
      .rect(tableX, y, tableWidth, 24)
      .fill("#EAF0F7");

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#183B66");

    doc.text("DISCIPLINA", tableX + 8, y + 8, {
      width: 200
    });

    doc.text("CÓDIGO", tableX + 215, y + 8, {
      width: 75
    });

    doc.text("TURMA", tableX + 300, y + 8, {
      width: 115
    });

    doc.text("CARGA", tableX + 425, y + 8, {
      width: 60,
      align: "right"
    });

    doc.y = y + 24;
  }

  drawTableHeader();

  enrollments.forEach((enrollment, index) => {
    if (doc.y + rowHeight > BOTTOM_LIMIT) {
      doc.addPage();
      doc.y = 40;
      drawTableHeader();
    }

    const y = doc.y;
    const discipline = enrollment.schoolClass.discipline;

    if (index % 2 === 0) {
      doc
        .rect(tableX, y, tableWidth, rowHeight)
        .fill("#F8FAFC");
    }

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#172B45");

    doc.text(discipline.name, tableX + 8, y + 8, {
      width: 200,
      ellipsis: true
    });

    doc.text(discipline.code || "-", tableX + 215, y + 8, {
      width: 75,
      ellipsis: true
    });

    doc.text(
      enrollment.schoolClass.code ||
        enrollment.schoolClass.name,
      tableX + 300,
      y + 8,
      {
        width: 115,
        ellipsis: true
      }
    );

    doc.text(
      `${discipline.workloadHours}h`,
      tableX + 425,
      y + 8,
      {
        width: 60,
        align: "right"
      }
    );

    doc.y = y + rowHeight;

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(0.5)
      .moveTo(tableX, doc.y)
      .lineTo(tableX + tableWidth, doc.y)
      .stroke();
  });

  // Reserva espaço para o resumo e a declaração.
  // Assim, eles permanecem juntos sempre que possível.
  ensureSpace(doc, 170);

  // Resumo da matrícula.
  const summaryY = doc.y + 8;

  doc
    .rect(LEFT, summaryY, CONTENT_WIDTH, 42)
    .fill("#EAF0F7");

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#183B66")
    .text(
      `Total de disciplinas: ${enrollments.length}`,
      LEFT + 12,
      summaryY + 8
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#183B66")
    .text(
      `Carga horária total: ${totalWorkload} horas`,
      LEFT + 12,
      summaryY + 23
    );

  doc.y = summaryY + 55;

  // Declaração.
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#526174")
    .text(
      "Declaramos, para os devidos fins, que o(a) aluno(a) identificado(a) neste documento possui as matrículas ativas nas disciplinas relacionadas, referentes ao período letivo informado.",
      LEFT,
      doc.y,
      {
        width: CONTENT_WIDTH,
        align: "justify",
        lineGap: 2
      }
    );

  // Emissão.
  doc.moveDown(1.2);

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#172B45")
    .text(
      `Emitido em ${formatDate(issuedAt)}.`,
      {
        align: "right"
      }
    );

  doc.moveDown(2);

  // Assinatura institucional.
  const signatureY = doc.y;

  doc
    .strokeColor("#9AA9BA")
    .lineWidth(0.8)
    .moveTo(175, signatureY)
    .lineTo(420, signatureY)
    .stroke();

  doc.moveDown(0.4);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#526174")
    .text("Syntesis - Sistema de Educação", {
      align: "center"
    });

  return doc;
}
