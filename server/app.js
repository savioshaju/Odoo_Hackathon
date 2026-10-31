const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { connectDB } = require('./config/db')
const { apiRouter } = require('./routes')


dotenv.config()
const app = express()
const port = 3000

connectDB()

app.listen(port, (err) => {
    if (err) {
        console.log('err :>> ', err);
    } else {
        console.log('Server running at port', port)
    }
})


app.use((req, res, next) => {
    console.log('\nreq.method :>> ', req.method);
    console.log('req.path :>> ', req.path);
    next()
})

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello World' })
})

app.use('/api', apiRouter)