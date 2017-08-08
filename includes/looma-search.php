<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 11
Revision: Looma 2.4
File: includes/looma-search.php
Description:  popup SEARCH panel for Looma pages
-->
    <link rel="stylesheet" href="css/looma-search.css">
    <link rel="stylesheet" href="css/font-awesome.min.css">

    <div id="search-panel">

        <!--
            #search-panel has 4 sections. all optional. CSS sets them to display:none. use JS to make them visible
            the sections are #search-filter, #class-subj-filter, #sort-criteria, and #search-criteria

            in addition, in #search-filter, CSS sets all .typ-chk checkboxes to display:none. JS can turn on/off individual .typ-chk checkboxes.
        -->
        <form id="search-form" action="looma-database-utilities.php" method="post">
            <input type="hidden" id="collection" value="activities" name="collection" />
            <input type="hidden" id="cmd" value="search" name="cmd" />

            <div id="search-filter">
                <span class="typ-chk"  id="vid-chk">
                    <input type="checkbox" name="type[]" value="video">   video   </input>
                </span>
                <span class="typ-chk"  id="aud-chk">
                    <input type="checkbox" name="type[]" value="audio">   audio   </input>
                </span>
                <span class="typ-chk"  id="img-chk">
                    <input type="checkbox" name="type[]" value="image">   image   </input>
                </span>
                <span class="typ-chk"  id="pdf-chk">
                    <input type="checkbox" name="type[]" value="pdf">     PDF     </input>
                <br></span>
                <span class="typ-chk"  id="txb-chk">
                    <input type="checkbox" name="type[]" value="textbook">textbook</input>
                </span>

                <span class="typ-chk"  id="txt-chk">
                    <input type="checkbox" name="type[]" value="text">    text    </input>
                </span>
                <span class="typ-chk"  id="text-template-chk">
                    <input type="checkbox" name="type[]" value="text-template">text template</input>
                </span>

                <span class="typ-chk"  id="lesson-chk">
                    <input type="checkbox" name="type[]" value="lesson">lesson</input>
                </span>
                <span class="typ-chk"  id="lesson-template-chk">
                    <input type="checkbox" name="type[]" value="lesson-template">lesson template</input>
                </span>

                <span class="typ-chk"  id="gam-chk">
                    <input type="checkbox" name="type[]" value="game">    game    </input>
                </span>

                <span class="typ-chk"  id="ss-chk">
                    <input type="checkbox" name="type[]" value="slideshow">slideshow</input>
                </span>
                <span class="typ-chk"  id="evi-chk">
                    <input type="checkbox" name="type[]" value="edited video">edited video</input>
                </span>
                <hr>
           </div>

           <div id="class-subj-filter">
                Class: <select id="class">
                  <option name="class" value="all" selected>All</option>
                  <option name="class" value="class1">Class 1</option>
                  <option name="class" value="class2">Class 2</option>
                  <option name="class" value="class3">Class 3</option>
                  <option name="class" value="class4">Class 4</option>
                  <option name="class" value="class5">Class 5</option>
                  <option name="class" value="class6">Class 6</option>
                  <option name="class" value="class7">Class 7</option>
                  <option name="class" value="class8">Class 8</option>
                </select>

                Subject: <select>
                  <option name="subj" value="all" selected>All</option>
                  <option name="subj" value="english">English</option>
                  <option name="subj" value="nepali">Nepali</option>
                  <option name="subj" value="math">Math</option>
                  <option name="subj" value="science">Science</option>
                  <option name="subj" value="socialstudies">Social Studies</option>
                </select>
                <hr>
            </div>

            <div id="sort-criteria">
                Sort:
                <input type="radio" name="sort" value="name"> Filename
                <input type="radio" name="sort" value="type"> Filetype
                <hr>
            </div>

            <div id="search-criteria">
                <div id="search-bar">Search: &nbsp;
                    <input type="text" name="search-term" placeholder="enter search term...">&nbsp;
                <button class = "filesearch" name="search" value="value" type="submit">
                    <i class="fa fa-search"></i></button>
                <hr>
                </div>
            </div>
        </form>

        <button id="cancel-search">Cancel</button>
    </div>

    <div id="search-results">  </div>
    <div id="search-preview">  </div>

    <script src="js/looma-search.js">   </script>