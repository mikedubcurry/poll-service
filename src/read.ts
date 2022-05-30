import { APIGatewayEvent } from "aws-lambda";
import {
  scanItems,
  getItem,
} from "./db";
import { Poll } from "./types";
import {response} from './utils'

export const getVotes = async (event: APIGatewayEvent) => {
  const response = await scanItems({
    TableName: process.env["POLL_TABLE"]!,
  });
  const votes = response.Items as Poll[];

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        votes,
        input: event,
      },
      null,
      2
    ),
  };
};

export const getPoll = async (event: APIGatewayEvent) => {
  let pollId = event.pathParameters ? event.pathParameters["pollId"] : null;

  if (!pollId) {
    return response(400, {
      status: "error",
      message: "Must supply pollId in path.",
    });
  }

  try {
    const result = await getItem({
      TableName: process.env["POLL_TABLE"]!,
      Key: { pollId },
    });

    if (!result) {
      return response(404, {
        status: "error",
        message: `poll: ${pollId} does not exist.`,
      });
    }

    return response(200, {
      status: "success",
      poll: result.Item,
    });
  } catch (e) {
    console.log(e);
    return response(500, {
      status: "error",
      message: e,
    });
  }
};
