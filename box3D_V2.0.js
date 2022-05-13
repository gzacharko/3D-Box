// Gregory Zacharko
// Intro to Computer Graphics
// Professor Rabbitz
// Spring 2022 Semester
// 4/19/2022
// Lab 5

// Some Global Variables
var program;
var canvas;
var gl;
var numVertices  = 36;  // Every Vertex Gets Duplicated Three Times
var wireframe = false;
var orthographicView = true;    // Orthogrtaphic View is ON by Default
var perspectiveView;

// Arrays
var pointsArray = [];
var colorsArray = [];
var BC_Array = [];
//                        0            3
//                          __________
//                        /|         /|                      
//                       / |        / |                      
//                      /  |     2 /  |
//                   1 /___|______/   |                   y
//                     |   |      |   |                   |
//                     |   | 4    |   |                   |
//                     |   /------|---| 7                 |
//                     |  /       |  /                    |_______ x
//                     | /        | /                    /
//                     |/_________|/                    /
//                    5             6                  /
//                                                    z
//

var vertices = [
    vec3( -0.5,  0.5, -0.5 ),  // 0
    vec3( -0.5,  0.5,  0.5 ),  // 1
    vec3(  0.5,  0.5,  0.5 ),  // 2
    vec3(  0.5,  0.5, -0.5 ),  // 3
    vec3( -0.5, -0.5, -0.5 ),  // 4
    vec3( -0.5, -0.5,  0.5 ),  // 5
    vec3(  0.5, -0.5,  0.5 ),  // 6
    vec3(  0.5, -0.5, -0.5 )   // 7
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),   // Black; Top
    vec4( 1.0, 0.0, 0.0, 1.0 ),   // Red; Bottom
    vec4( 0.0, 1.0, 1.0, 1.0 ),   // Cyan; Front
    vec4( 0.0, 1.0, 0.0, 1.0 ),   // Green; Back
    vec4( 0.0, 0.0, 1.0, 1.0 ),   // Blue; Right
    vec4( 1.0, 0.0, 1.0, 1.0 )    // Magenta; Left
];

// View Projection Variables
var near = -5;
var far = 5;
var yaw = 0.0;
var pitch = 0.0;
var dr = 0.5;       // Degree Step

var left = -1.5;
var right = 1.5;
var ytop = 1.5;
var bottom = -1.5;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eyeRange = 3.0;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// Function quad Uses First Index to Set Color For Face
function quad(a, b, c, d, col)
{
    // Triangle 1
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[col]);
    BC_Array.push(vec3(1.0, 0.0, 0.0));

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[col]);
    BC_Array.push(vec3(0.0, 1.0, 0.0));

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[col]);
    BC_Array.push(vec3(0.0, 0.0, 1.0));

    // Triangle 2
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[col]);
    BC_Array.push(vec3(1.0, 0.0, 0.0));

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[col]);
    BC_Array.push(vec3(0.0, 1.0, 0.0));

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[col]);
    BC_Array.push(vec3(0.0, 0.0, 1.0));
};

// Each Face Determines Two Triangles
function colorCube()
{
    quad( 0, 1, 2, 3, 0 );   // Top
    quad( 4, 7, 6, 5, 1 );   // Bottom
    quad( 1, 5, 6, 2, 2 );   // Front
    quad( 0, 3, 7, 4, 3 );   // Back
    quad( 3, 7, 6, 2, 4 );   // Right
    quad( 0, 4, 5, 1, 5 );   // Left
};

// Define Callback Function for window.onload
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );      // Get HTML Canvas
    gl = canvas.getContext('webgl2');                     // Get a WebGL 2.0 Context
    if ( !gl ) { alert( "WebGL isn't available" ); }      // Error Message

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.4, 0.4, 0.8, 1.0 );                  // Set Background Color of Viewport (Clear Color)

    gl.enable(gl.DEPTH_TEST);   // Hidden Surface Removal via the z-buffer (z-buffer ON by Default)

    // Load Shaders and Initialize Attribute Buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();    // Set the Colors for the Faces of the Cube

    // Color Attribute VBO
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    // Set Up Vertex Shader Attribute vColor
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vColor);

    // VBO for Points
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    // Set Up Vertex Shader Attribute vPosition
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vPosition);
    
    // BC Attribute VBO
    var bcBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bcBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(BC_Array), gl.STATIC_DRAW );
    
    // Set Up Vertex Shader Attribute bcBuffer
    var bcCoord = gl.getAttribLocation( program, "bcCoord" );
    gl.vertexAttribPointer( bcCoord, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(bcCoord);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    render();
};

// Callback Function for Keydown Events; Registers Function dealWithKeyboard
window.addEventListener("keydown", dealWithKeyboard, false);

// Function that Gets Called to Parse Keydown Events
function dealWithKeyboard(e) {
    switch (e.keyCode) {
        case 37: // Left Arrow; Sweep Left
            { yaw += dr * 20; }
        break;
        case 39: // Right Arrow; Sweep Right
            { yaw -= dr * 20; }
        break;
        case 38: // Up Arrow; Sweep Up
            { pitch += dr * 20; }
        break;
        case 40: // Down Arrow; Sweep Down
            { pitch -= dr * 20; }
        break;
    }
};

// Buttons to Change Viewing Parameters
document.getElementById("SweepUp").onclick = function () { pitch += dr; };     // Sweep Up
document.getElementById("SweepDown").onclick = function() { pitch -= dr; };    // Sweep Down
document.getElementById("SweepRight").onclick = function() { yaw -= dr; };     // Sweep Right
document.getElementById("SweepLeft").onclick = function() { yaw += dr; };      // Sweep Left
document.getElementById("DollyOut").onclick = function() { eyeRange += dr; };  // Dolly Out
document.getElementById("ZBufferOn").onclick = function() { gl.enable(gl.DEPTH_TEST); };    // zBuffer On
document.getElementById("ZBufferOff").onclick = function() { gl.disable(gl.DEPTH_TEST); };  // zBuffer Off

// Dolly In
document.getElementById("DollyIn").onclick = function()
{
    if(eyeRange > 0.5)
    {
        eyeRange -= dr;
    }
    else    // Never Let eyeRange Get Below 0.5
    {
        eyeRange = 0.5;
    }
};

// Wireframe View
document.getElementById("Wireframe").onclick = function()
{
    if(wireframe == true)           // If Wireframe View is ON, Turn it OFF
    {
        wireframe = false;
    }
    else if(wireframe == false)     // If Wireframe View is OFF, Turn it ON
    {
        wireframe = true;
    }
};

// Perspective View
document.getElementById("Perspective").onclick = function()
{
    // Turn ON Perspective View and Turn OFF Orthographic View
    perspectiveView = true;
    orthographicView = false;
};

// Orthographic View (ON by Default)
document.getElementById("Orthographic").onclick = function()
{
    // Turn ON Orthographic View and Turn OFF Perspective View
    orthographicView = true;
    perspectiveView = false;
};

// Render Function
var render = function()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    v = vec4(0.0, 0.0, eyeRange, 1.0);        // Default Eye Vector
    R1 = rotate(pitch, vec3(1.0, 0.0, 0.0));  // Pitch About x-axis
    R2 = rotate(yaw, vec3(0.0, 1.0, 0.0));    // Yaw About y-axis
    R = mult(R1, R2);                         // Combine View Rotation Matricies Into One Matrix
    v = mult(R, v);                           // Multiply by the Default Eye Position to Get the Current Eye Position
        
    modelViewMatrix = lookAt(vec3(v[0], v[1], v[2]), at , up);  // Call lookAt with Eye Postion

    // Orthographic View (Default)
    if(orthographicView == true)
    {
        projectionMatrix = ortho(left, right, bottom, ytop, near, far);  // Set Up a 3D Orthogonal Projection
    }

    // Perspective View
    if(perspectiveView == true)
    {
        projectionMatrix = perspective(45.0, 1, 1, 1000);   // Set Up a Perspective Projection
    }

    // Update modelView and Projection Matrices in Vertex Shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));   
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Wireframe Code For When It Is Turned On
    var widthLoc = gl.getUniformLocation(program, "width");
    var width = (wireframe) ? 0.006 : 1.0;
    gl.uniform1f(widthLoc, width);

    // Render the Triangles of the Box
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    requestAnimationFrame(render);
};