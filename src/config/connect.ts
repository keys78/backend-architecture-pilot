import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const dbUri = process.env.DB_URI;
    if (!dbUri) {
      throw new Error('DB_URI is not defined in environment variables');
    }

    await mongoose.connect(dbUri);
    console.log('Database connection successful');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error connecting to MongoDB:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
};

export default connectDB;
