# Computer Graphics, Winter Semester 2023

- **Name:** Your name, e.g., Maxi Musterfrau
- **E-Mail:** Your e-mail, e.g., silvesterkisalu@gmail.com
- **Matriculation no.:** Your matriculation number: 123456789

<!--------------------------------------------------------------------------->
## Assignment 1

### Assigment 1a
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->
for this solution first i had to uncomment the commented out lines this is because the vertex shader needed to calculate the interpolated vertex attributes which are v_position, v_normal, v_eyeDir, v_lightDir that i then pass to the fragment shader. after i create acode to calculate the direction of the light. v_normal: Normalized normal vector in camera space. v_eyeDir: Direction from the fragment to the camera.
v_lightDir: Direction from the fragment to the light source. The eye and light directions are calculated in world space.

### Assigment 1b
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->
Adding the controls for the light required the use of the utils.js where i updated the setupInterface in order to be able to use the tweakpane in the meshrenderer.html after the update of the setupInterface i added some code functions to the html file that is meshrenderer in th render function so as to set the controls for the program.

## Assignment 2

### Assignment 2a
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->
To implement texture mapping using the ambientMap, diffuseMap, specularMap i had first to modify the fragment shader.here i had to take the interpolated Attributes that are v_position v_normal v_eyeDir v_lightDir and then use the mentioned technologies in order to execute a functional texture sampling thsi was first ensured using the reflectionDi which helps to Calculate the reflection direction vector.specularHighlight that would help in the calculation specular reflection using the reflection and eye direction vectors. after all this i combine the componenents that is ambient, diffuse, and specular components with their corresponding texture colors then i get the final color after combining all components to get the final color.

### Assignment 2b
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->
first i check if the bump map contains tangent space normals and checks also to see if they are RGB then i update the fragment shader and the vertex shader in order to get a new encoded formation for the ebsite after which i implemented the bump map
### Assignment 2c
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->
firstly i will create a function that generates height values to simulate surface irregularities. in order to create a GUI that will enable the user to have control over the design and the image i used tweakpane where i implemented the cntrols.
### Assigment 2 Extras
<!-- Describe any extra features that you implemented. Make sure to cite your sources. -->

<!--------------------------------------------------------------------------->
## Assignment 3

### Assignment 3a
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->
First i add a spline interpolation library to the meshrenderer.html next i update the javascript in the meshrenderer by creating a variable let cameraKeyframes = []; to store camera keyframes then i create a function to add a keyframe based on the current camera matrix then in order to keep the camera keyframes in check i create a function to remove the last keyframe when the functions and the animations end. afterwards i will create spline curve based on keyframes to begin the animation process.

### Assignment 3b
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->

### Assignment 3 Extras
<!-- Describe any extra features that you implemented. Make sure to cite your sources. -->

<!--------------------------------------------------------------------------->
## Assignment 4

### Assignment 4a
this solution requires the multiplication of the spheres and then a creation to check if the spheres are blocking each other from the light source. this is all iplemented through the updating of the fragment shader where i add code valuess for the other two spheres and also an adjustable code that checks if the at any time the spheres are blocking the light source. if the spheres block the light source of either the one that has been blocked will recieve a casting shadow, in this case it will turn black. 

### Assignment 4b
<!-- Briefly describe your solution. If you did not solve the assignment, simply enter "Not solved." -->

### Assignment 4 Extras
<!-- Describe any extra features that you implemented. Make sure to cite your sources. -->
for this part tweak pane came in handy it helped in the creation of the GUI where  had to first add code about the spheres into the utils.js file in order toget a working file then i implemented response