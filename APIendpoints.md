# Authentication

POST http://localhost:3000/api/v1/auth/send-otp

POST http://localhost:3000/api/v1/auth/authentication

# User

GET http://localhost:3000/api/v1/users/:id

PATCH http://localhost:3000/api/v1/users/:id

GET http://localhost:3000/api/v1/users/:id/primaryChat

GET http://localhost:3000/api/v1/users/:id/secondaryChat

PATCH http://localhost:3000/api/v1/users/:id/chat/:chatId

# Messages

GET http://localhost:3000/api/v1/messages/search

GET http://localhost:3000/api/v1/messages/all

GET http://localhost:3000/api/v1/messages/:userId/messages