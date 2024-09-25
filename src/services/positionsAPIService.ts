
import UserPositionsIB, { usersPositionsIBDocument } from "../models/usersPositionsIB.model";

export const deleteAllPositions = async (user: any) => {
    try {
    //@ts-ignore
        await global.io.emit("deletePositionsDB", {
            user: user
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
};
export const closeSpecificPosition = async (user: any, IB_ID: any) => {
    try {
        //@ts-ignore
        await global.io.emit("closeSpecificPosition", {
            user: user,
            IB_ID: IB_ID,
        });
        await UserPositionsIB.updateOne({ user: user, IB_ID: IB_ID }, { active: false });
        console.log(user, IB_ID);
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const closeAllPositions = async (user: any) => {
    try {
        //@ts-ignore
        await global.io.emit("closeAllPositions", {
            user: user
        });
        return user
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const extractPositionsDetails = async (user: any) => {
    try {
        //@ts-ignore
        await global.io.emit("extractPositionDetails", {
            user: user
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const getActivePositions = async (user: any) => {
    try {
        const activePositions = await UserPositionsIB.find({user: user, active: true});
        console.log("active positions sent", activePositions)
        return activePositions
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const closePosition = async (user: any, IB_ID: any) => {
    try {
        const closePosition = await UserPositionsIB.updateOne({ user: user, IB_ID: IB_ID }, { active: false })
        console.log("position closed on MongoDB", IB_ID)
        return "success"
    } catch (err) {
        console.log(err);
        throw err;
    }
};


