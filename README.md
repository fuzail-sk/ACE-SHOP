# SmartCart

Full-stack MERN e-commerce platform with authentication, product management, cart/checkout, orders, automated invoice generation, and email workflows.

## Stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- Tailwind CSS (to be added in UI phase)
- PDF invoice generation
- Nodemailer email automation

## Project Structure
```text
smartcart/
├── client/        # React frontend
├── server/        # Express REST API
├── docs/          # Project documentation
├── .env.example
└── README.md
```

## Run locally

### Server
```bash
cd server
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

Configure `server/.env` from `server/.env.example` before starting the API.
