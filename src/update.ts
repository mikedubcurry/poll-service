import { APIGatewayEvent } from "aws-lambda";
import { updateItem, buildExpression, buildAttributes, getItem } from "./db";
import { Poll } from "./types";
import { response } from "./utils";

export const vote = async (event: APIGatewayEvent) => {
  let pollId = event.pathParameters ? event.pathParameters["pollId"] : null;

  if (!pollId) {
    return response(400, {
      status: "error",
      message: "must supply pollId in path.",
    });
  }
  if (!event.body) {
    return response(400, {
      status: "error",
      message: "Provide a JSON body.",
    });
  }
  const body = JSON.parse(event.body);
  if (!body || !body.vote || typeof body.vote !== "string") {
    return response(400, {
      status: "error",
      message: "Provide JSON body.",
    });
  }

  const { Item } = await getItem({
    TableName: process.env["POLL_TABLE"]!,
    Key: { pollId },
  });
  const poll = Item as Poll;
  if (!poll) {
    return response(404, {
      status: "error",
      message: `poll: ${pollId} does not exist.`,
    });
  }

  if (poll.done) {
    return response(400, {
      status: "error",
      message: `Poll: ${pollId} ended.`,
    });
  }

  if (!poll.answers.includes(body.vote)) {
    return response(400, {
      status: "error",
      message: "Provide valid vote.",
    });
  }

  if (poll.pollId) {
    delete poll.pollId;
  }
  if (poll.lastUpdatedAt) {
    delete poll.lastUpdatedAt;
  }
  poll.votes[body.vote] += 1;

  try {
    const votedOn = await updateItem({
      TableName: process.env["POLL_TABLE"]!,
      Key: { pollId },
      ExpressionAttributeValues: {
        ...buildAttributes(poll),
        ":lastUpdatedAt": new Date().toISOString(),
      },
      UpdateExpression: `SET ${buildExpression(
        poll
      )}, lastUpdatedAt = :lastUpdatedAt`,
      ReturnValues: "ALL_NEW",
    });

    return response(200, {
      status: "success",
      poll: votedOn.Attributes,
    });
  } catch (e) {
    console.log(e);
    return response(500, {
      status: "error",
      message: e,
    });
  }
};

export const endPoll = async (event: APIGatewayEvent) => {
  let pollId = event.pathParameters ? event.pathParameters["pollId"] : null;

  if (!pollId) {
    return response(400, {
      status: "error",
      message: "must supply pollId in path.",
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
        message: `Poll: ${pollId} does not exist.`,
      });
    }

    const poll = result.Item as Poll;
    if (poll.pollId) {
      delete poll.pollId;
    }
    poll.done = true;
    poll.lastUpdatedAt = new Date().toISOString();

    try {
      const result = await updateItem({
        TableName: process.env["POLL_TABLE"]!,
        Key: { pollId },
        ExpressionAttributeValues: {
          ...buildAttributes(poll),
        },
        UpdateExpression: `SET ${buildExpression(poll)}`,
        ReturnValues: "ALL_NEW",
      });

      return response(200, {
        status: "success",
        poll: result.Attributes,
      });
    } catch (e) {
      console.log(e);
      return response(500, {
        status: "error",
        message: e,
      });
    }
  } catch (e) {
    console.log(e);
    return response(500, {
      status: "error",
      message: e,
    });
  }
};
