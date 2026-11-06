export function errorMiddleware(err, req, res, next) {
  console.error("Erro na aplicação:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  return res.status(statusCode).json({
    mensagem:
      statusCode === 500
      //acredite, eu vi isso mais doq gostaria por coisa besta
        ? "Erro interno do servidor."
        : err.message || "Ocorreu um erro na solicitação."
  });
}