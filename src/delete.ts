import { APIGatewayEvent } from "aws-lambda";
import { deleteItem } from "./db";
import { response } from "./utils";

export const deletePoll = async (event: APIGatewayEvent) => {
  let pollId = event.pathParameters ? event.pathParameters["pollId"] : null;

  if (!pollId) {
    return response(400, {
      status: "error",
      message: "Must supply pollId in path.",
    });
  }

  try {
    const result = await deleteItem({
      TableName: process.env["POLL_TABLE"]!,
      Key: { pollId },
      ReturnValues: "ALL_OLD",
    });

    return response(200, {
      status: "success",
      message: `poll: ${pollId} deleted`,
      poll: result.Attributes,
    });
  } catch (e) {
    console.log(e);
    return response(500, {
      status: "error",
      message: e,
    });
  }
};
