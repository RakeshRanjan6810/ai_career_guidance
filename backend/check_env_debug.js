require('dotenv').config();
console.log("--- DEBUG START ---");
if (process.env.GROQ_API_KEY) {
    console.log("GROQ_KEY_STATUS: PRESENT");
} else {
    console.log("GROQ_KEY_STATUS: MISSING");
}
console.log("--- DEBUG END ---");
