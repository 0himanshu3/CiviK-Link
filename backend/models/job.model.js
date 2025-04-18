// import mongoose from "mongoose"

// const VolunteeringPositionSchema = new mongoose.Schema({
//     title: {
//         type: String, 
//         required: true
//     },
//     slots: {
//         type: Number, 
//         required: true
//     },
//     registeredUsers: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//     }],
//     waGroupLink: {
//         type: String,
//         default: ""
//     }
// })

// const jobSchema = new mongoose.Schema({
//     issue: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Issue",
//         required: true
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
//     title: {
//         type: String,
//         required: true
//     },
//     description: {
//         type: String,
//         required: true
//     },
//     volunteeringPositions: [VolunteeringPositionSchema],
//     startDate
// }, {timestamps: true})

// export default mongoose.model("Job", jobSchema);