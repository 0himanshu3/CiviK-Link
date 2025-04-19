// import { Notification } from "../models/notification.model.js";
// import { User } from "../models/user.model.js";
// import Issue from "../models/issue.model.js";
// import Job from "../models/job.model.js";
// import { sendEmail } from "../utils/sendEmail.js";
// import { io } from "../server.js";

// //Notify when issue is picked up by an NGO
// export const notifyIssuePicked = async (issueId, ngoId) => {
//   try {
//     const issue = await Issue.findById(issueId).populate("postedBy");
//     const ngo = await User.findById(ngoId);

//     if (!issue || !ngo) return;

//     // Notify issue reporter
//     await Notification.create({
//       userId: issue.postedBy._id,
//       message: `Your reported issue "${issue.title}" has been picked up by NGO "${ngo.name}".`,
//       type: "issue-assigned",
//       issueSlug: issue.slug,
//     });
//     io.to(issue.postedBy._id.toString()).emit("new-notification", {
//       message: `Your issue "${issue.title}" is being addressed by "${ngo.name}".`,
//       type: "issue-assigned",
//       isRead: false,
//     });

//     // Notify all upvoters (assuming you store upvoters as an array of user IDs)
//     const upvoters = issue.upvoters || []; // Make sure to store upvoters in your Issue model
//     for (const userId of upvoters) {
//       if (userId.toString() !== issue.postedBy._id.toString()) { // Avoid duplicate notification
//         await Notification.create({
//           userId,
//           message: `An issue you upvoted, "${issue.title}", has been picked up by NGO "${ngo.name}".`,
//           type: "issue-assigned",
//           issueSlug: issue.slug,
//         });
//         io.to(userId.toString()).emit("new-notification", {
//           message: `An issue you upvoted, "${issue.title}", is being addressed by "${ngo.name}".`,
//           type: "issue-assigned",
//           isRead: false,
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error in notifyIssuePicked:", error);
//   }
// };

// //Notify volunteer on task assignment
// export const notifyTaskAssignment = async (userId, jobId, positionTitle) => {
//   try {
//     const job = await Job.findById(jobId).populate("issue");
//     const user = await User.findById(userId);
//     if (!job || !user) return;

//     // In-app notification
//     await Notification.create({
//       userId,
//       message: `You have been assigned to the volunteering position "${positionTitle}" for the issue "${job.issue.title}".`,
//       type: "task-assigned",
//       jobId: job._id,
//       issueSlug: job.issue.slug,
//     });
//     io.to(userId.toString()).emit("new-notification", {
//       message: `You have been assigned to "${positionTitle}" for "${job.issue.title}".`,
//       type: "task-assigned",
//       isRead: false,
//     });

//     // Email notification
//     const emailBody = generateTaskAssignmentEmailTemplate(user.name, job.issue.title, positionTitle);
//     await sendEmail({
//       email: user.email,
//       subject: "You've been assigned a volunteering task!",
//       message: emailBody,
//     });
//   } catch (error) {
//     console.error("Error in notifyTaskAssignment:", error);
//   }
// };

// //Notify donor on donation completion
// export const notifyDonationCompletion = async (userId, amount, causeTitle) => {
//   try {
//     const user = await User.findById(userId);
//     if (!user) return;

//     // In-app notification
//     await Notification.create({
//       userId,
//       message: `Thank you for donating ₹${amount} to "${causeTitle}".`,
//       type: "donation-completed",
//       causeTitle,
//     });
//     io.to(userId.toString()).emit("new-notification", {
//       message: `Thank you for donating ₹${amount} to "${causeTitle}".`,
//       type: "donation-completed",
//       isRead: false,
//     });

//     // Email notification
//     const emailBody = generateDonationCompletionEmailTemplate(user.name, amount, causeTitle);
//     await sendEmail({
//       email: user.email,
//       subject: "Donation Received - Thank You!",
//       message: emailBody,
//     });
//   } catch (error) {
//     console.error("Error in notifyDonationCompletion:", error);
//   }
// };

// //Remind users about jobs in their location
// export const sendJobReminders = async () => {
//   try {
//     // Find jobs starting within 2 days
//     const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
//     const jobs = await Job.find({ startDate: { $lte: twoDaysFromNow } }).populate("issue");

//     for (const job of jobs) {
//       // Find users in the same location as the job's issue
//       const users = await User.find({ location: job.issue.issueLocation });
//       for (const user of users) {
//         await Notification.create({
//           userId: user._id,
//           message: `A volunteering opportunity for "${job.issue.title}" is happening soon in your area.`,
//           type: "job-reminder",
//           jobId: job._id,
//           issueSlug: job.issue.slug,
//         });
//         io.to(user._id.toString()).emit("new-notification", {
//           message: `A volunteering opportunity for "${job.issue.title}" is happening soon in your area.`,
//           type: "job-reminder",
//           isRead: false,
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error sending job reminders:", error);
//   }
// };


// export const sendNotification = async (req, res, next) => {
//   try {
//     const { userId, message, type } = req.body;
//     if (!userId || !message || !type) {
//       return next(new ApiError(400, "userId, message, and type are required"));
//     }
//     const notification = await Notification.create({ userId, message, type });
//     return res.status(201).json(new ApiResponse(201, notification, "Notification sent successfully"));
//   } catch (error) {
//     next(new ApiError(500, "Error sending notifications"));
//   }
// };

// export const getAllNotifications = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
//     return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
//   } catch (error) {
//     next(error);
//   }
// };

// export const markNotificationAsRead = async (req, res, next) => {
//   try {
//     const updatedNotification = await Notification.findByIdAndUpdate(
//       req.params.notificationId,
//       { isRead: true },
//       { new: true }
//     );
//     if (!updatedNotification) {
//       return next(new ApiError(404, "Notification not found"));
//     }
//     return res.status(200).json(new ApiResponse(200, updatedNotification, "Notification updated successfully"));
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteNotification = async (req, res, next) => {
//   try {
//     const { notificationId } = req.params;
//     const deletedNotification = await Notification.findByIdAndDelete(notificationId);
//     if (!deletedNotification) {
//       return next(new ApiError(404, "Notification not found"));
//     }
//     return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
//   } catch (error) {
//     next(error);
//   }
// };
