const mySql = require("mysql2/promise");

/**
 * Objeto con la configuración de la base de datos MySQL a utilizar.
 */
const SQL_CONFIGURATION_DATA =
{

    host: "10.1.5.205",              // en tu casa: "186.19.136.253" // en el pio:"10.1.5.205"
    user: "2026_5INF_G20",
    password: "9122018",
    database: "2026_5INF_G20",
    port: 3306,
    charset: 'UTF8_GENERAL_CI'
}

/**
 * Realiza una query a la base de datos MySQL indicada en el archivo "mysql.js".
 * @param {String} queryString Query que se desea realizar. Textual como se utilizaría en el MySQL Workbench.
 * @param {Array} params Valores para los placeholders "?" de la query (query preparada). Opcional.
 * @returns Respuesta de la base de datos. Suele ser un vector de objetos.
 */
exports.realizarQuery = async function (queryString, params = [])
{
    let connection;
    try
    {
        connection = await mySql.createConnection(SQL_CONFIGURATION_DATA);
        const [rows] = await connection.execute(queryString, params);
        return rows;
    }
    catch(err)
    {
        console.log(err);
        throw err; 
    }
    finally
    {
        if(connection && connection.end) connection.end();
    }
}