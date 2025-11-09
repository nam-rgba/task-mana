import { IsOptional, IsString, Length } from 'class-validator'

export class CreateTeamDto {
	@IsString()
	@Length(3, 100)
	name: string

	// @IsOptional()
}
