
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateAst, parseSynvertSnippet } from './lib/api';

export const generateAstHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body);
    const node = generateAst(requestBody.code);
    return {
      statusCode: 200,
      body: JSON.stringify({ node })
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    }
  }
}

export const parseSynvertSnippetHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body);
    const output = parseSynvertSnippet(requestBody.code, requestBody.snippet)
    return {
      statusCode: 200,
      body: JSON.stringify({ output })
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    }
  }
}