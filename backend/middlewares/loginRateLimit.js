import { rateLimit } from "express-rate-limit";

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, //depois de eu ter ficado engastaiado nisso, pensando seriamente em tirar
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      mensagem: "Muitas tentativas de login. Tente novamente em 15 minutos."
    });
  }
});

export default loginRateLimit;