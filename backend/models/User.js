const mongoose = require('mongoose'); // Import Mongoose (the bridge between Node and our Database)

/**
 *LOGIC: THE USER MODEL
 * This is the "M" in MVC. It acts as a blueprint for every user in our system.
 */
const userSchema = new mongoose.Schema({
    // Rule for Username: It must be text and it cannot be empty.
    username: { 
        type: String, 
        required: true 
    },
    
    // Rule for Email: Mandatory, must be text, and UNIQUE.
    // 'unique: true' prevents two people from signing up with the same email.
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    
    // Rule for Password: We store the "Hashed" (scrambled) version here.
    // It is marked as required because an account must be secure.
    password: { 
        type: String, 
        required: true 
    },
    
    // Member 3 specific: Automatically record when the account was made.
    // 'Date.now' puts the current time in the database automatically.
    accountCreated: { 
        type: Date, 
        default: Date.now 
    }
});

// We turn this blueprint into a "Model" named 'User' and export it.
// This allows our Controller to say "User.create()" or "User.find()".
module.exports = mongoose.model('User', userSchema);
