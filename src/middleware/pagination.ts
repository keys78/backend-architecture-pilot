// import mongoose from 'mongoose';

// export const paginateResults = async (
//   model: mongoose.Model<unknown>,
//   query: unknown,
//   req
// ) => {
//   const { page = 1, limit = 10 } = req.query;
//   const parsedPage = parseInt(page as string);
//   const parsedLimit = parseInt(limit as string);

//   const totalResults = await model.countDocuments(query);
//   const totalPages = Math.ceil(totalResults / parsedLimit);
//   const skipCount = (parsedPage - 1) * parsedLimit;

//   const results = await model
//     .find(query)
//     .sort({ _id: -1 })
//     .skip(skipCount)
//     .limit(parsedLimit)
//     .exec();

//   return {
//     totalPages,
//     currentPage: parsedPage,
//     limit: parsedLimit,
//     totalResults,
//     results,
//   };
// };
