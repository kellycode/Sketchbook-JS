import { CharacterStateBase } from "../stateLibrary.js";

import { Side } from "../../../enums/Side.js";
import { SeatType } from "../../../enums/SeatType.js";
import * as Utils from "../../../core/FunctionLibrary.js";

export class CloseVehicleDoorInside extends CharacterStateBase {
    constructor(character, seat) {
        super(character);

        this.seat = seat;
        this.canFindVehiclesToEnter = false;
        this.canLeaveVehicles = false;
        this.hasClosedDoor = false;

        const side = Utils.detectRelativeSide(seat.seatPointObject, seat.door.doorObject);
        if (side === Side.Left) {
            this.playAnimation("driving", 0.1);
        } else if (side === Side.Right) {
            this.playAnimation("driving", 0.1);
        }

        if (this.seat && this.seat.door) {
            this.seat.door.open();
        }
    }

    update(timeStep) {
        super.update(timeStep);

        if (this.timer > 0.4 && !this.hasClosedDoor) {
            this.hasClosedDoor = true;

            if (this.seat && this.seat.door) {
                this.seat.door.close();
            }
        }

        if (this.animationEnded(timeStep)) {
            if (this.seat.type === SeatType.Driver) {
                this.character.setState(new this.character.anims.Driving(this.character, this.seat));
            } else if (this.seat.type === SeatType.Passenger) {
                this.character.setState(new this.character.anims.Sitting(this.character, this.seat));
            }
        }
    }
}
