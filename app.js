import express, { query } from "express"; 
import path from "path"; 
import cors from "cors"; 
import router from "./router/rutas.js";
import { fileURLToPath } from "url"; 
import morgan from "morgan"; 
import dotenv from 'dotenv' 

dotenv.config()






const app = express();  
const port = process.env.PUERTO;

app.use(morgan('dev')) 

  

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: false })); 
app.use(express.json());  


const urlfront=process.env.URL_F
const urlBack=process.env.URL_B
const Db=process.env.DB

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors({
    origin: [
       `${urlfront}`, 
        `${urlBack}`, 
         `${Db}`, 
       
    ],
    credentials: true
}));  






app.use('/',router)






app.listen(port, () => { 
    console.log(`Se está escuchando el puerto ${port}`);
});



