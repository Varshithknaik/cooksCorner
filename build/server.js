"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
require("dotenv").config();
const PORT = process.env.PORT ?? 8000;
app_1.app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
