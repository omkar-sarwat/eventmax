const Joi = require('joi');

// User validation schemas
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string().valid('user', 'admin').default('user')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  next();
};

// Event validation schemas
const validateEventCreate = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    category: Joi.string().required(),
    venue: Joi.string().required(),
    date: Joi.date().greater('now').required(),
    time: Joi.string().required(),
    price: Joi.number().min(0).required(),
    total_seats: Joi.number().integer().min(1).required(),
    image_url: Joi.string().uri().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  next();
};

const validateEventUpdate = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).optional(),
    category: Joi.string().optional(),
    venue: Joi.string().optional(),
    date: Joi.date().greater('now').optional(),
    time: Joi.string().optional(),
    price: Joi.number().min(0).optional(),
    total_seats: Joi.number().integer().min(1).optional(),
    image_url: Joi.string().uri().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  next();
};

// Booking validation schemas
const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    event_id: Joi.string().uuid().required(),
    seats: Joi.array().items(
      Joi.object({
        seat_number: Joi.string().required(),
        row: Joi.string().required(),
        section: Joi.string().optional()
      })
    ).min(1).required(),
    total_amount: Joi.number().min(0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  next();
};

// Generic validation helpers
const validateId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string().uuid().required()
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid ID format' 
    });
  }
  next();
};

const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('date', 'price', 'title', 'created_at').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  
  req.pagination = value;
  next();
};

const validateRequest = {
  register: validateRegister,
  login: validateLogin,
  eventCreate: validateEventCreate,
  eventUpdate: validateEventUpdate,
  booking: validateBooking,
  id: validateId,
  pagination: validatePagination
};

module.exports = validateRequest;