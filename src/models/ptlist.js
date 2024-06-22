const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ptlistSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    markdetails: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PtList", ptlistSchema);
