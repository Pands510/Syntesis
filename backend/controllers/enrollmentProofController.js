import {
  getMyEnrollmentProofData
} from "../services/enrollmentProofService.js";

import {
  generateEnrollmentProofPdf
} from "../utils/enrollmentProofPdf.js";

export async function getMyEnrollmentProof(req, res) {
  try {
    const data = await getMyEnrollmentProofData(req.user.id);

    const pdf = generateEnrollmentProofPdf(data);

    const registrationNumber =
      data.student.registrationNumber || "sem-matricula";

    const safeRegistrationNumber = registrationNumber.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `inline; filename="comprovante-matricula-${safeRegistrationNumber}.pdf"`
    );

    res.setHeader("Cache-Control", "no-store");

    pdf.pipe(res);
    pdf.end();
  } catch (error) {
    console.error("Erro ao emitir comprovante de matrícula:", error);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao gerar comprovante de matrícula."
    });
  }
}