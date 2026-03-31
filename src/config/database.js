import mongoose from 'mongoose'
//import dotenv from 'dotenv'
mongoose.set('strictQuery', true)

const connection = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI_ATLAS)

        console.log(`Database connected on ${conn.connection.host}`)
    } catch (error) {
        console.error("Database connection error:", error)
        process.exit(1)
    }
}

export default connection