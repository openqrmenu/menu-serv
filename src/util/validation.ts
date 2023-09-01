import { ValidationError, Result } from "express-validator";

export function validationErrorMsg(result: Result, onlyFirst: boolean = true) : string
{
  let errorMsg = "Validation Failed: ";
  for (const error of result.array())
  {
    errorMsg += error.msg + " with " + error.param + " parameter";
    if (onlyFirst)
      break;
  }
  return errorMsg;
}

