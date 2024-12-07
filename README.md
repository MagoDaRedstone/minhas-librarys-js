# minhas-librarys-js
fiz uma library DetectError.js:
Essa minha library ela detecta qual quer erro javascript no html.
eu so nao testei para os arquivos externos <script src="seuarquivo.js"></script>
para usar ela ela e bem simples e so vc usar dessa forma aki com try catch:
try {
    // função nao existente na tag <script>
    nonExistentFunction();
} catch (error) {
    DetectError.log({type: "Runtime Error",message: error.message,stack: error.stack,url: "N/A",line: "N/A",column: "N/A",});
}
