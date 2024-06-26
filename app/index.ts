import express from 'express';
import cors from 'cors';
import { QueueManager } from './rabbitMQ/setupRabbit';
import { RegisterRoutes } from './routes/routes';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from "../dist/swagger.json";
import { createConnection } from 'typeorm';
import { config } from 'dotenv';
import {expressjwt} from "express-jwt"
import jwt from "jsonwebtoken"
import multer from 'multer';


/***
 * Load environment variables from a .env file into process.env
*/
config();
declare global {
  namespace Express {
    interface Request {
      userGuid?: string;
    }
  }
}


const connectionOptions = {
  name: "default",
  type: "mssql" as const,
  host: process.env.DB_SERVER,
  port: Number(process.env.WRITE_DB_SERVER_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.WRITE_DB,
  synchronize: false,
  entities: ["app/entities/entities/*.ts"],
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));

/***
 * Middleware to parse the request body as JSON
*/
app.use(express.json({ limit: '2mb' }));


// Use your custom middleware
app.use('/v1', (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const secret = Buffer.from(process.env.JWT_SECRET, 'base64').toString();
  
  try {
    const decodedToken = jwt.verify(token, secret) as {id: string};
    req.userGuid = decodedToken.id;
    next();
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
});

// Get the QueueManager instance and set up the queue
const queueManager = QueueManager.getInstance();
queueManager.setupQueue('new_stories').then((ch) => {
  console.log('RabbitMQ new_stories setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('update_story_info').then((ch) => {
  console.log('RabbitMQ update_story_info setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('update_comment_info').then((ch) => {
  console.log('RabbitMQ update_comment_info setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('new_comments').then((ch) => {
  console.log('RabbitMQ new_comment setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('delete_story').then((ch) => {
  console.log('RabbitMQ delete_story setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('delete_comment').then((ch) => {
  console.log('RabbitMQ delete_comment setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('new_images').then((ch) => {
  console.log('RabbitMQ new_images setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

queueManager.setupQueue('new_comment_on_story').then((ch) => {
  console.log('RabbitMQ new_comment_on_story setup completed');
}).catch(err => {
  console.error('Failed to setup RabbitMQ', err);
});

const router = express.Router();

// TODO: createConnection is deprecated, What else can be used?
// TODO: ormconfig.json has to use the environment variables
createConnection(connectionOptions).then(async connection => {
  // Your previous setup code here
  
  RegisterRoutes(router);
  app.use('/v1', router);
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(error => console.log(error));

// connectDB.initialize().then(async () => {
  //   RegisterRoutes(app);
  //   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  //   app.listen(3000, () => {
    //     console.log(`Server is running on port ${PORT}`);
    //   });
    // });