import { APIGatewayEvent } from "aws-lambda";
import { updateItem, buildExpression, buildAttributes } from "./db";
import { Poll } from "./types";
import { v4 as uuid } from "uuid";
import { response } from "./utils";

export const createPoll = async (event: APIGatewayEvent) => {
  if (!event.body) {
    return response(400, {
      status: "error",
      message: "Provide a JSON body.",
    });
  }
  const body = JSON.parse(event.body);

  if (
    !body.question ||
    !body.answers ||
    body.answers.length !== 4 ||
    body.answers.filter((a: any) => typeof a === "string").length !== 4
  ) {
    return response(400, {
      status: "error",
      message: "Provide a question, and four possible answers.",
    });
  }

  const newPoll: Poll = {
    question: body.question,
    answers: body.answers,
    done: false,
    votes: body.answers.reduce(
      (votes: { [key: string]: number }, answer: string) => {
        votes[answer] = 0;
        return votes;
      },
      {}
    ),
  };
  const pollId = uuid();
  let createdAt = new Date().toISOString();
  try {
    const poll = await updateItem({
      TableName: process.env["POLL_TABLE"]!,
      Key: { pollId },
      UpdateExpression: `SET ${buildExpression(
        newPoll
      )}, createdAt = :createdAt, lastUpdatedAt = :lastUpdatedAt`,
      ExpressionAttributeValues: {
        ...buildAttributes(newPoll),
        ":createdAt": createdAt,
        ":lastUpdatedAt": createdAt,
      },
      ReturnValues: "ALL_NEW",
    });

    return response(200, {
      status: "success",
      poll: poll.Attributes,
    });
  } catch (e) {
    console.log(e);
    return response(500, {
      status: "error",
      message: e,
    });
  }
};
