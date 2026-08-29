//Apagar depois pois já serviu para gerar a senha

import bcrypt from "bcrypt";

const hash = await bcrypt.hash("12345", 10);

console.log(hash);