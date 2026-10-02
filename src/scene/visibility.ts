import {Camera,Frustum,Matrix4,Sphere,Vector3} from 'three';
const frustum=new Frustum(),matrix=new Matrix4(),sphere=new Sphere();
export function simulationVisible(camera:Camera,center:Vector3,radius=5){
 if(camera.position.distanceToSquared(center)>(28+radius)**2)return false;
 matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);sphere.center.copy(center);sphere.radius=radius;return frustum.intersectsSphere(sphere);
}
