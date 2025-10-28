# Authentication


    ### @api http://localhost:3000/api/v1/auth/send-otp     ✅
    ### @method POST
    ### @accept phoneNumber in body
    ### @return otp sent to user phone number       




    ### @api http://localhost:3000/api/v1/auth/authentication    ✅
    ### @method POST
    ### @accept phoneNumber and otp in body
    ### @return user data and access token     


# User


    ### @api http://localhost:3000/api/v1/users/me    ✅
    ### @method GET
    ### @accept auth token from headers
    ### @return user current profile data




    ### @api http://localhost:3000/api/v1/users/:U_id    ✅
    ### @method GET
    ### @accept U_Id from path params and auth token from headers
    ### @return user profile data




    ### @api http://localhost:3000/api/v1/users/updateUserProfile    ✅
    ### @method PATCH
    ### @accept auth token from headers
    ### @accept body: {description}
    ### @return updated user profile data




    ### @api http://localhost:3000/api/v1/users/primaryChat    ✅
    ### @method GET
    ### @accept auth token from headers
    ### @return list of primary chats (accepted contacts)




    ### @api http://localhost:3000/api/v1/users/secondaryChat    ✅
    ### @method GET
    ### @accept auth token from headers
    ### @return list of secondary chats (message requests)




    ### @api http://localhost:3000/api/v1/users/chat/:chatId
    ### @method PATCH
    ### @accept chatId from path params and auth token from headers
    ### @accept body: {primaryChat, secondaryChat}
    ### @return updated user chat info




    ### @api http://localhost:3000/api/v1/users/accept/:requesterId    ✅
    ### @method POST
    ### @accept requesterId from path params and auth token from headers
    ### @return success message with updated primaryChat




    ### @api http://localhost:3000/api/v1/users/delete/:requesterId    ✅
    ### @method DELETE
    ### @accept requesterId from path params and auth token from headers
    ### @return success message




    ### @api http://localhost:3000/api/v1/users/block/:userId    ✅
    ### @method POST
    ### @accept userId from path params and auth token from headers
    ### @return success message




    ### @api http://localhost:3000/api/v1/users/unblock/:userId    ✅
    ### @method POST
    ### @accept userId from path params and auth token from headers
    ### @return success message




    ### @api http://localhost:3000/api/v1/users/blocked    ✅
    ### @method GET
    ### @accept auth token from headers
    ### @return array of blocked users with details


# Messages


    ### @api http://localhost:3000/api/v1/messages/search    ✅
    ### @method GET
    ### @accept query param: uid (U_Id), auth token from headers
    ### @return user info if found




    ### @api http://localhost:3000/api/v1/messages/all    ✅
    ### @method GET
    ### @accept auth token from headers
    ### @return list of all chats (primary + secondary)




    ### @api http://localhost:3000/api/v1/messages/send    ✅
    ### @method POST
    ### @accept auth token from headers
    ### @accept body: {receiverId, text, encryptedText, iv, encryptedSessionKey, messageType, mediaUrl}
    ### @return sent message object




    ### @api http://localhost:3000/api/v1/messages/:userId/messages    ✅
    ### @method GET
    ### @accept userId from path params and auth token from headers
    ### @return list of messages with specific user




    ### @api http://localhost:3000/api/v1/messages/:messageId/delete-for-me    ✅
    ### @method DELETE
    ### @accept messageId from path params and auth token from headers
    ### @return success message




    ### @api http://localhost:3000/api/v1/messages/:messageId/delete-for-everyone    ✅
    ### @method DELETE
    ### @accept messageId from path params and auth token from headers
    ### @return success message (only sender, within 1 hour)
