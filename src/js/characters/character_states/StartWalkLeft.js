import {StartWalkBase} from './stateLibrary.js';

export class StartWalkLeft extends StartWalkBase
{
	constructor(character)
	{
		super(character);

		this.animationLength = character.setAnimation('turn_left', 0.1);
	}
}