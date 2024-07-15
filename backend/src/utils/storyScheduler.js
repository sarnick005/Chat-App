import cron from "node-cron";
import { Story } from "../models/stories.Model.js"; 

cron.schedule("0 * * * *", async () => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    await Story.updateMany(
      {
        createdAt: { $lte: twentyFourHoursAgo },
        isDeleted: false,
      },
      { $set: { isDeleted: true } }
    );
    console.log("Stories older than 24 hours have been marked as deleted");
  } catch (error) {
    console.error("Error in marking old stories as deleted:", error);
  }
});
