import * as THREE from "three";
import * as Utils from "../core/FunctionLibrary.js";

import { Vehicle } from "./Vehicle.js";
import { KeyBinding } from "../core/KeyBinding.js";
import { EntityType } from "../enums/EntityType.js";

export class Helicopter extends Vehicle {
    constructor(gltf) {
        super(gltf);

        this.entityType = EntityType.Helicopter;
        this.rotors = [];
        this.enginePower = 0;

        this.readHelicopterData(gltf);

        this.collision.preStep = (body) => {
            this.physicsPreStep(body, this);
        };

        this.actions = {
            ascend: new KeyBinding("ShiftLeft"),
            descend: new KeyBinding("Space"),
            pitchUp: new KeyBinding("KeyS"),
            pitchDown: new KeyBinding("KeyW"),
            yawLeft: new KeyBinding("KeyQ"),
            yawRight: new KeyBinding("KeyE"),
            rollLeft: new KeyBinding("KeyA"),
            rollRight: new KeyBinding("KeyD"),
            exitVehicle: new KeyBinding("KeyF"),
            seat_switch: new KeyBinding("KeyX"),
            view: new KeyBinding("KeyV"),
        };
    }

    noDirectionPressed() {
        let result = !this.actions.ascend.isPressed && !this.actions.descend.isPressed;

        return result;
    }

    update(timeStep) {
        super.update(timeStep);

        // Rotors visuals
        if (this.controllingCharacter !== undefined) {
            if (this.enginePower < 1) this.enginePower += timeStep * 0.2;
            if (this.enginePower > 1) this.enginePower = 1;
        } else {
            if (this.enginePower > 0) this.enginePower -= timeStep * 0.06;
            if (this.enginePower < 0) this.enginePower = 0;
        }

        this.rotors.forEach((rotor) => {
            rotor.rotateX(this.enginePower * timeStep * 30);
        });
    }

    onInputChange() {
        super.onInputChange();

        if (this.actions.exitVehicle.justPressed && this.controllingCharacter !== undefined) {
            this.forceCharacterOut();
        }
        if (this.actions.view.justPressed) {
            this.toggleFirstPersonView();
        }
    }

    physicsPreStep(body, heli) {
        let quat = Utils.threeQuat(body.quaternion);
        let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
        let globalUp = new THREE.Vector3(0, 1, 0);
        let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
        let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

        // Throttle
        if (heli.actions.ascend.isPressed) {
            body.velocity.x += up.x * 0.15 * this.enginePower;
            body.velocity.y += up.y * 0.15 * this.enginePower;
            body.velocity.z += up.z * 0.15 * this.enginePower;
        }
        if (heli.actions.descend.isPressed) {
            body.velocity.x -= up.x * 0.15 * this.enginePower;
            body.velocity.y -= up.y * 0.15 * this.enginePower;
            body.velocity.z -= up.z * 0.15 * this.enginePower;
        }

        // Vertical stabilization
        let gravity = heli.world.physicsWorld.gravity;
        let gravityCompensation = new CANNON.Vec3(-gravity.x, -gravity.y, -gravity.z).length();
        gravityCompensation *= heli.world.physicsFrameTime;
        gravityCompensation *= 0.98;
        let dot = globalUp.dot(up);
        gravityCompensation *= Math.sqrt(THREE.MathUtils.clamp(dot, 0, 1));

        let vertDamping = new THREE.Vector3(0, body.velocity.y, 0).multiplyScalar(-0.01);
        let vertStab = up.clone();
        vertStab.multiplyScalar(gravityCompensation);
        vertStab.add(vertDamping);
        vertStab.multiplyScalar(heli.enginePower);

        body.velocity.x += vertStab.x;
        body.velocity.y += vertStab.y;
        body.velocity.z += vertStab.z;

        // Positional damping
        body.velocity.x *= THREE.MathUtils.lerp(1, 0.995, this.enginePower);
        body.velocity.z *= THREE.MathUtils.lerp(1, 0.995, this.enginePower);

        // Rotation stabilization
        if (this.controllingCharacter !== undefined) {
            let rotStabVelocity = new THREE.Quaternion().setFromUnitVectors(up, globalUp);
            rotStabVelocity.x *= 0.3;
            rotStabVelocity.y *= 0.3;
            rotStabVelocity.z *= 0.3;
            rotStabVelocity.w *= 0.3;
            let rotStabEuler = new THREE.Euler().setFromQuaternion(rotStabVelocity);

            body.angularVelocity.x += rotStabEuler.x * this.enginePower;
            body.angularVelocity.y += rotStabEuler.y * this.enginePower;
            body.angularVelocity.z += rotStabEuler.z * this.enginePower;
        }

        // Pitch
        if (heli.actions.pitchUp.isPressed) {
            body.angularVelocity.x -= right.x * 0.07 * this.enginePower;
            body.angularVelocity.y -= right.y * 0.07 * this.enginePower;
            body.angularVelocity.z -= right.z * 0.07 * this.enginePower;
        }
        if (heli.actions.pitchDown.isPressed) {
            body.angularVelocity.x += right.x * 0.07 * this.enginePower;
            body.angularVelocity.y += right.y * 0.07 * this.enginePower;
            body.angularVelocity.z += right.z * 0.07 * this.enginePower;
        }

        // Yaw
        if (heli.actions.yawLeft.isPressed) {
            body.angularVelocity.x += up.x * 0.07 * this.enginePower;
            body.angularVelocity.y += up.y * 0.07 * this.enginePower;
            body.angularVelocity.z += up.z * 0.07 * this.enginePower;
        }
        if (heli.actions.yawRight.isPressed) {
            body.angularVelocity.x -= up.x * 0.07 * this.enginePower;
            body.angularVelocity.y -= up.y * 0.07 * this.enginePower;
            body.angularVelocity.z -= up.z * 0.07 * this.enginePower;
        }

        // Roll
        if (heli.actions.rollLeft.isPressed) {
            body.angularVelocity.x -= forward.x * 0.07 * this.enginePower;
            body.angularVelocity.y -= forward.y * 0.07 * this.enginePower;
            body.angularVelocity.z -= forward.z * 0.07 * this.enginePower;
        }
        if (heli.actions.rollRight.isPressed) {
            body.angularVelocity.x += forward.x * 0.07 * this.enginePower;
            body.angularVelocity.y += forward.y * 0.07 * this.enginePower;
            body.angularVelocity.z += forward.z * 0.07 * this.enginePower;
        }

        // Angular damping
        body.angularVelocity.x *= 0.97;
        body.angularVelocity.y *= 0.97;
        body.angularVelocity.z *= 0.97;
    }

    readHelicopterData(gltf) {
        gltf.scene.traverse((child) => {
            if (child.hasOwnProperty("userData")) {
                if (child.userData.hasOwnProperty("data")) {
                    if (child.userData.data === "rotor") {
                        this.rotors.push(child);
                    }
                }
            }
        });
    }

    inputReceiverInit() {
        super.inputReceiverInit();

        this.world.updateControls([
            {
                keys: ["Shift"],
                desc: "Ascend",
            },
            {
                keys: ["Space"],
                desc: "Descend",
            },
            {
                keys: ["W", "S"],
                desc: "Pitch",
            },
            {
                keys: ["Q", "E"],
                desc: "Yaw",
            },
            {
                keys: ["A", "D"],
                desc: "Roll",
            },
            {
                keys: ["V"],
                desc: "View select",
            },
            {
                keys: ["F"],
                desc: "Exit vehicle",
            },
            {
                keys: ["Shift", "+", "R"],
                desc: "Respawn",
            },
            {
                keys: ["Shift", "+", "C"],
                desc: "Free camera",
            },
        ]);
    }
}
