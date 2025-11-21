const jwt = require('jsonwebtoken');

// Middleware básico de autenticação
exports.protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; 
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Não autorizado, sem token.' });
  }
};

// Middleware de Autorização (Controle de Acesso)
exports.authorize = (...grupos) => {
  return (req, res, next) => {
    if (!req.user || !grupos.includes(req.user.grupo)) {
      return res.status(403).json({ 
        error: `Acesso negado. Rota permitida apenas para: ${grupos.join(', ')}` 
      });
    }
    next();
  };
};