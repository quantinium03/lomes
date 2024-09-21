import { register } from '../db/crud.js';
import { apiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if([username, email, password].some((field) => field?.trim() === "") {
    throw new apiError(400, "All fields are required");
  }
  
  try {
    const id = await register(username, email, password);
    res.status(201).json(
        new apiResponse(200, id, "User Created Successfully")
    )
  } catch (err) {
        res
        .status(500)
        .json(
            new apiResponse(500,"Couldn't register user")
        )
  }
});