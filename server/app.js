const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const { connectDB } = require('./config/db')
const { apiRouter } = require('./routes')
const dns = require('dns')

dns.setServers(['1.1.1.1', '8.8.8.8'])

dotenv.config()
const app = express()
const port = process.env.PORT || 3000

connectDB()

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    console.log('\nreq.method :>> ', req.method);
    console.log('req.path :>> ', req.path);
    next()
})

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello World' })
})

app.use('/api', apiRouter)

app.listen(port, (err) => {
    if (err) {
        console.log('err :>> ', err);
    } else {
        console.log('Server running at port', port)
    }
})