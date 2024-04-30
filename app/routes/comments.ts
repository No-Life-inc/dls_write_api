import {Body, Post, Route, Request} from "tsoa";
import express from "express";
import {CreateCommentDTO} from "../entities/interfaces/CreateCommentDTO";
import {CommentDTO} from "../entities/DTOs/CommentDTO";
import {User} from "../entities/entities/User"
import {Comment} from "../entities/entities/Comment"
import {getRepository} from "typeorm";
import {CommentInfo} from "../entities/entities/CommentInfo";
import {Story} from "../entities/entities/Story"
import {HttpError} from "routing-controllers";
import {publishNewComment} from "../rabbitMQ/publishNewComment"

const router = express.Router();

@Route('/comments')
export class CommentsController{
    @Post()
    public async createComment(@Request() request: express.Request, @Body() requestBody: CreateCommentDTO): Promise<CommentDTO>{
        const userRepository = getRepository(User);
        let user;
        try{
            user = await userRepository.findOne({ where: { userGuid: request.userGuid }});
        if(!user){
            throw new HttpError(400,'User not found')
        }}catch(error){
            console.error("Error fetching user:",error)
        }

        const storyRepository = getRepository(Story)
        const story = await storyRepository.findOne({where: {storyGuid: requestBody.story.storyGuid}, relations: ['storyInfos']})

        if(!story){
            throw new HttpError(404, 'Story not found');
        }

        let newComment = new Comment();
        newComment.commentGuid = requestBody.commentGuid;
        newComment.createdAt = new Date();
        newComment.user = user;
        let newCommentInfo = new CommentInfo();
        newCommentInfo.bodyText = requestBody.commentInfo.bodyText;
        newCommentInfo.createdAt = new Date();
        newCommentInfo.comment = newComment;
        newComment.commentInfos = [newCommentInfo]
        newComment.story = story;
        newComment.story.storyGuid = requestBody.story.storyGuid;
        story.user = user;

        try{
            await storyRepository.save(story);
        }catch(error){
            throw new HttpError(400, 'Failed to add comment to story');
        }

        const commentDTO = new CommentDTO(newComment)

        publishNewComment(commentDTO)
        return commentDTO;
    }
}

export default router;