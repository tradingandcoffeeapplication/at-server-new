import express from "express";
import compression from "compression"; // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import MongoStore from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import bluebird from "bluebird";
import { MONGODB_URI } from "./util/secrets";
import { Server } from "socket.io";
import { createServer } from "http";
import PositionsService from "./services/positions.service";
import SocketService from "./services/socket.service";
import Sender from "./services/sender.service";
import passport from "passport";
import cors from "cors";
import positionsController from "./controllers/positionsController";
import authController from "./controllers/authController";
import cron from "node-cron";
import usersPositionsIB from "./models/usersPositionsIB.model";
import UserSetup from "./models/userSetup";
import UserInfo from "./models/usersInfo";

cron.schedule('0 7 * * 1-6', async () => {
    await usersPositionsIB.deleteMany({});
    await RiskManagmetHandler();
    const Users  = await UserInfo.find({});
    Users.map(async (user)=> {
        await UserInfo.findOneAndUpdate({_id: user._id}, {startOfTheDayBalance: user.currentBalance})
    })
});

const RiskManagmetHandler = async () => {
    const activeRiskAccounts = await UserSetup.find({ riskActive: true });
    activeRiskAccounts.map(async (user) => {
        const handleAccountOnRisk = async (accountType: any) => {
            let updateString = `${accountType}.activeAccount`;
            let updateString2 = `accountsOnRisk.${accountType}`
            let updateDoc = {
                $set: { [updateString]: true, [updateString2]: false }
            };
            await UserSetup.updateOne({ userEmail: user.userEmail }, updateDoc)
        }
        user.accountsOnRisk.stocks === true ? handleAccountOnRisk('stocks') : console.log();
        user.accountsOnRisk.comodity === true ? handleAccountOnRisk('comodity') : console.log();
        user.accountsOnRisk.bonds === true ? handleAccountOnRisk('bonds') : console.log();
        user.accountsOnRisk.crypto === true ? handleAccountOnRisk('crypto') : console.log();
        user.accountsOnRisk.indexes === true ? handleAccountOnRisk('indexes') : console.log();
        user.accountsOnRisk.currencyPairs === true ? handleAccountOnRisk('currencyPairs') : console.log();
       await UserSetup.updateOne({ userEmail: user.userEmail }, { riskActive: false })

    })
};


const LocalStrategy = require("passport-local").Strategy;
// const { localStrategyHandler, serializeUser, deserializeUser } = require('./config/passport');
const passportConfig = {
    usernameField: "email",
    passwordField: "password"
};

// Create Express server
const app = express();
const server = require("http").createServer(app);
const PORT: any = process.env.PORT || 4455;

// MONGODB DETAILS
const mongoUrl = "mongodb://adminnew:x8engX86cy8B@80.179.152.210:27018/TradingData?authSource=admin";
// const mongoUrl = "mongodb+srv://jovany:Jj12345@cluster0.4mfvt.mongodb.net/TradingData";
mongoose.Promise = bluebird;


// הגדרות השרת

// app.set("port", process.env.PORT || 4455);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(session({
    secret: "Jovani123!$@#$",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl,
        mongoOptions: {
            autoReconnect: true
        },
    }),
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 60 * 60000 * 24 * 7
    },
}));

// passport.use('local', new LocalStrategy(localStrategyHandler, passportConfig));
// passport.serializeUser(serializeUser); //סיריאלייז למשתמש
// passport.deserializeUser(deserializeUser); //דיסיריאלייז למשתמש


// app.use(passport.initialize());
// app.use(passport.session());

app.use(flash());

app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);


app.use('/positions', positionsController);
app.use('/auth', authController)


const init = async () => { //פונקצייה חכמה שמוודאת התחברות לדאטא בייס לפני הפעלת השרת
    try {
        const mongooseConnection = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        };

        await mongoose.connect(mongoUrl, mongooseConnection);
        server.listen(PORT,async () => { //הפעלת השרת
            console.log("server is up on port" + PORT);
        });
    } catch (err) { //במידה והתחברות נכשלה
        console.log(err);
    }
};

init();


//הגדרות socket.io
const httpServer = createServer(app);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// הוספת אירועים להתחברות והתנתקות לקוח
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore


SocketService.addListenersToSocketAndUpdateTables(global.io);

httpServer.listen(3007);
PositionsService.listenToPositions();
export default app;
