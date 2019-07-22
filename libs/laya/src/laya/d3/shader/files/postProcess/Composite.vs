attribute vec4 a_Position;
varying vec2 v_Texcoord0;

vec2 TransformTriangleVertexToUV(vec2 vertex)
{
    vec2 uv = (vertex + 1.0) * 0.5;
    return uv;
}

void main() {
	gl_Position =vec4(a_Position.xy, 0.0, 1.0);
	v_Texcoord0=TransformTriangleVertexToUV(a_Position.xy);
	gl_Position=remapGLPositionZ(gl_Position);
}