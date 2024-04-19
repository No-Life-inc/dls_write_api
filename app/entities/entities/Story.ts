import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Comment } from "./Comment";
import { Reaction } from "./Reaction";
import { User } from "./User";
import { StoryInfo } from "./StoryInfo";
import { StoryReaction } from "./StoryReaction";
import { CreateStoryDTO } from "../DTOs/createStoryDTO";
import { StoryDTO } from "../DTOs/StoryDTO";

@Index("PK__stories__66339C5618AA3FAD", ["storyId"], { unique: true })
@Entity("stories", { schema: "dbo" })
export class Story {

  constructor(dto?: StoryDTO) {
    if (dto) {
      this.storyGuid = dto.storyGuid;
      this.createdAt = dto.createdAt;
      this.user = new User();
      this.user.userGuid = dto.user.userGuid;
      this.storyInfos = dto.storyInfos.map(storyInfoDTO => {
        let storyInfo = new StoryInfo();
        storyInfo.title = storyInfoDTO.title;
        storyInfo.bodyText = storyInfoDTO.bodyText;
        storyInfo.imgUrl = storyInfoDTO.imgUrl;
        return storyInfo;
      });
    }
  }

  @PrimaryGeneratedColumn({ type: "int", name: "story_id" })
  storyId: number;

  @Column("uniqueidentifier", { name: "story_guid", nullable: true })
  storyGuid: string;

  @Column("datetime", { name: "created_at", nullable: false, default: () => "getdate()"})
  createdAt: Date;

  @OneToMany(() => Comment, (comments) => comments.story)
  comments: Comment[];

  @OneToMany(() => Reaction, (reactions) => reactions.story)
  reactions: Reaction[];

  @ManyToOne(() => User, (users) => users.stories)
  @JoinColumn([{ name: "user_id", referencedColumnName: "userId" }])
  user: User;

  @OneToMany(() => StoryInfo, (storyInfo) => storyInfo.story, { cascade: true }) //needs to be cascade for it to be created
  storyInfos: StoryInfo[];

  @OneToMany(() => StoryReaction, (storyReaction) => storyReaction.story)
  storyReactions: StoryReaction[];
}
