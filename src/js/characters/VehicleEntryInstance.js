import * as THREE from 'three';

export class VehicleEntryInstance
{
	constructor(character)
	{
		this.character = character;
		this.targetSeat;
		this.entryPoint;
		this.wantsToDrive = false;
	}

	 update(timeStep)
	{
		let entryPointWorldPos = new THREE.Vector3();
		this.entryPoint.getWorldPosition(entryPointWorldPos);
		let viewVector = new THREE.Vector3().subVectors(entryPointWorldPos, this.character.position);
		this.character.setOrientation(viewVector);
		
		let heightDifference = viewVector.y;
		viewVector.y = 0;
		if (this.character.charState.canEnterVehicles && viewVector.length() < 0.2 && heightDifference < 2) {
			this.character.enterVehicle(this.targetSeat, this.entryPoint);
		}
	}
}