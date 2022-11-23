const { query } = require('express');
const express = require('express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const pool = require('./db');
const PORT = 8000;
app.use(express.json())


app.listen(
    PORT,
    () => console.log(`I'm alive at http://localhost:${PORT}`)
)

function methods(methods, req, res, next) {
  if (methods.includes(req.method)) return next();

  res.set({'Allow': methods});
  return res.status(405).send();
}

app.all('/sets', methods.bind(this, ['GET', 'POST']));
app.all('/sets/:id', methods.bind(this, ['GET', 'PUT', 'PATCH', 'DELETE']));


// GET /sets => getting all rows
app.get('/sets', async(req, res) => {
    const poolRes = await pool.query("SELECT name, price, series FROM lego_sets;")
    res.status(200).send({
        total: poolRes.rowCount,
        sets: poolRes.rows
    })
});


// GET /sets/{id} => getting a row by id
app.get('/sets/:id', async(req, res) => {
    const { id } = req.params
    const poolRes = await pool.query(`SELECT * FROM lego_sets WHERE id=${id}`)
    // res.send(poolRes)
    if (poolRes.rowCount > 0) {
        var row = poolRes.rows[0]

        var minifigs = []
        const poolMf = await pool.query(`SELECT * FROM minifigs WHERE lego_id=${id}`)
        for (var i=0; i<poolMf.rows.length; i++) {
            minifigs.push(poolMf.rows[i].name)
        }
        row["minifigs"] = minifigs

        res.status(200).send(row)
    } else {
        res.status(404).send(`ERROR: Bad request. Resource not found with ID# ${id}`)
    }
})

// POST /sets => creating new row
app.post('/sets', async(req, res) => {
    const {name, description, series, pieces, minifigs, price} = req.body

    if (name && description && series && pieces && price) {
        const postRes = await pool.query(`INSERT INTO lego_sets(name, description, series, pieces, price) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [name, description, series, pieces, price])
        const newRowID = postRes.rows[0].id
        if (minifigs) {
            for (var i=0; i<minifigs.length; i++) {
                a = pool.query(`INSERT INTO minifigs(lego_id, name) VALUES ($1, $2)`, [newRowID, minifigs[i]])
            }
        }

        res.status(200).send({
            status: 0,
            message: "New set added",
            id: newRowID
        })
    } else {
        res.status(418).send("ERROR: Bad request. Must include name, description, series, pieces, and price")
    }
})


// PUT /sets/{id} => updating a whole row by id
app.put('/sets/:id', async(req, res) => {
    const { id } = req.params
    const checkExists = await pool.query(`SELECT * FROM lego_sets WHERE id=$1`, [id])
    // console.log(checkExists)
    if (checkExists.rowCount > 0) {
        const {name, description, series, pieces, minifigs, price} = req.body
        if (name && description && series && pieces && price) {
            const postRes = await pool.query(`UPDATE lego_sets SET name=$1, description=$2, series=$3, pieces=$4, price=$5 WHERE id=$6`, [name, description, series, pieces, price, id])
            if (minifigs) {
                pool.query(`DELETE FROM minifigs WHERE lego_id=$1`, [id])
                for (var i=0; i<minifigs.length; i++) {
                    a = pool.query(`INSERT INTO minifigs(lego_id, name) VALUES ($1, $2)`, [id, minifigs[i]])
                }
            }
            res.status(200).send({
                status: 0,
                message: "Set updated"
            })
        } else {
            res.status(418).send("ERROR: Bad request. Must include name, description, series, pieces, and price data")
        }
    } else {
        res.status(404).send(`ERROR: Bad request. Resource not found with ID# ${id}`)
    }
})

// PATCH /sets/{id} => modifying a column in a row id
app.patch('/sets/:id', async(req, res) => {
    const { id } = req.params
    const checkExists = await pool.query(`SELECT * FROM lego_sets WHERE id=$1`, [id])

    if (checkExists.rowCount > 0) {
        const {name, description, series, pieces, minifigs, price} = req.body
        // console.log(name, description, series, pieces, minifigs, price)

        if (name) await pool.query("UPDATE lego_sets SET name=$1 WHERE id=$2", [name, id])
        if (description) await pool.query("UPDATE lego_sets SET description=$1 WHERE id=$2", [description, id])
        if (series) await pool.query("UPDATE lego_sets SET series=$1 WHERE id=$2", [series, id])
        if (pieces) await pool.query("UPDATE lego_sets SET pieces=$1 WHERE id=$2", [pieces, id])
        if (price) await pool.query("UPDATE lego_sets SET price=$1 WHERE id=$2", [price, id])

        if (minifigs) {
            await pool.query("DELETE FROM minifigs WHERE lego_id=$1", [id])
            for (var i=0; i<minifigs.length; i++) {
                await pool.query("INSERT INTO minifigs(lego_id, name) VALUES($1, $2)", [id, minifigs[i]])
            }
        }

        res.status(200).send({
            status: 0,
            message: "Set modified"
        })
    } else {
        res.status(404).send(`ERROR: Bad request. Resource not found with ID# ${id}`)
    }

})

// DELETE /sets/{id} => deleting entire row by id
app.delete('/sets/:id', async(req, res) => {

    const { id } = req.params
    await pool.query(`DELETE FROM minifigs WHERE lego_id=$1`, [id])
    await pool.query(`DELETE FROM lego_sets WHERE id=$1`, [id])

    res.status(200).send({
        status: 0,
        message: "Set deleted"
    })
})



// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Lego Store API",
            description: "API for Lego Store [CMPUT 401 Assignment 1]",
            contact: {
                name: "Sukanta Saha"
            },
            servers: ["http://localhost:7070"]
        }
    },
    apis: ["index.js"]
}
const swaggerDocs = swaggerJSDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Routes Doc
/**
 * @swagger
 * /sets:
 *  get:
 *    description: Get all lego sets
 *    responses:
 *      '200':
 *        description: A successful response
 *
 */
