
import { rateLimit } from "express-rate-limit";

const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      mensagem: "Muitas tentativas de recuperação de senha. Tente novamente em 15 minutos."
    });
  }
});

export default passwordResetRateLimit;
