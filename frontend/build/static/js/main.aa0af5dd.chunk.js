(this.webpackJsonpfrontend=this.webpackJsonpfrontend||[]).push([[0],{102:function(e,t,a){e.exports=a(526)},113:function(e,t,a){},49:function(e,t){},5:function(e,t,a){a(43).config(),e.exports={host:"https://zen-camino.com",port:""}},506:function(e,t,a){},525:function(e,t,a){},526:function(e,t,a){"use strict";a.r(t);var n=a(0),s=a.n(n),r=a(38),i=a.n(r),o=a(9),c=a(26),l={isLoggedIn:!1,isAdmin:!1},u=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:l,t=arguments.length>1?arguments[1]:void 0;switch(t.type){case"SET_SESSION":return Object.assign({},t.session,{isLoggedIn:!0});case"CLEAR_SESSION":return l;default:return e}},m=Object(c.c)({session:u}),p=a(92);a(43).config();var d=c.d,h=Object(c.e)(m,d(Object(c.a)(p.a))),f=(a(113),a(7)),b=a(8),g=a(11),v=a(10),E=a(27),N=a(93),y=a(98),k=a(94);a(43).config();var S={apiUrl:"https://zen-camino.com",region:"us-east-1",userPool:"us-east-1_7dmZzXWTs",clientId:"69mrmc3pptcr4sli93igf45gai",userPoolBaseUri:"https://umanage.auth.us-east-1.amazoncognito.com",callbackUri:"https://zen-camino.com/login",signoutUri:"https://zen-camino.com/logout",tokenScopes:["openid","email","profile"],apiUri:"https://zen-camino.com"},O=a(19),j=a.n(O);function I(e){j.a.set("x-token",e)}function x(){return function(e){return function(){if(j.a.get("x-token")){var e=JSON.parse(j.a.get("x-token")),t=Date.now()/1e3;if(e.expiration>t)return e}return!1}()&&_().then((function(t){I(t),e({type:"SET_SESSION",session:t})})),!1}}function C(e){return function(t){return F(e).then((function(){return _()})).then((function(e){I(e),t({type:"SET_SESSION",session:e})}))}}k.config.region=S.region;var w=function(){var e=S.userPoolBaseUri.replace("https://","").replace("http://","");return new N.CognitoAuth({UserPoolId:S.userPool,ClientId:S.clientId,AppWebDomain:e,TokenScopesArray:S.tokenScopes,RedirectUriSignIn:S.callbackUri,RedirectUriSignOut:S.signoutUri})},T=function(){return U().getCurrentUser()},U=function(){return new y.a({UserPoolId:S.userPool,ClientId:S.clientId})},F=function(e){return new Promise((function(t,a){var n=w();n.userhandler={onSuccess:function(e){t(e)},onFailure:function(e){a(new Error("Failure parsing Cognito web response: "+e))}},n.parseCognitoWebResponse(e)}))},_=function(){return new Promise((function(e,t){T().getSession((function(a,n){if(!a&&n){var s={credentials:{accessToken:n.accessToken.jwtToken,idToken:n.idToken.jwtToken,refreshToken:n.refreshToken.token},user:{userName:n.idToken.payload["cognito:username"],email:n.idToken.payload.email},groups:n.idToken.payload["cognito:groups"],isAdmin:n.idToken.payload["cognito:groups"]instanceof Array&&-1!==n.idToken.payload["cognito:groups"].indexOf("Admin"),expiration:n.accessToken.payload.exp};e(s)}else t(new Error("Failure getting Cognito session: "+a))}))}))},A=function(){return"".concat(S.userPoolBaseUri,"/login?response_type=code&client_id=").concat(S.clientId,"&redirect_uri=").concat(S.callbackUri)},R=function(){j.a.get("x-token")&&j.a.remove("x-token"),w().signOut()},D=(a(506),a(21)),M=a(41),z=a(13),L=a.n(z),P=a(5),B=a.n(P),V=function(e){return s.a.createElement("header",{className:"background rgba-black-strong"},s.a.createElement("div",{className:"main-container"},s.a.createElement("div",{className:"container"},e.children)))},H=a(22),W=a(23),J=function(e){return s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card mx-auto"},s.a.createElement("div",{href:"#"},s.a.createElement(H.a,{className:"float-right card-close",icon:W.d,size:"2x",onClick:e.returnToIndex})),s.a.createElement("div",{className:"card-text"},e.children)))},K=function(e){return s.a.createElement("form",{className:"row",id:"create-post-form",onSubmit:e.processFormSubmission,noValidate:!0},s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"Username"}," User Name "),s.a.createElement("input",{disabled:!!e.edit&&"disabled",type:"text",id:"Username",defaultValue:e.edit&&e.user.Username||"",onChange:function(t){return e.handleInputChanges(t)},name:"Username",className:"form-control",placeholder:"Enter a Username for the user"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"name"}," Name "),s.a.createElement("input",{type:"text",id:"name",defaultValue:e.edit&&e.user.name||"",onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Enter user's first name"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"email"}," Email "),s.a.createElement("input",{type:"email",id:"email",defaultValue:e.edit&&e.user.email||"",onChange:function(t){return e.handleInputChanges(t)},name:"email",className:"form-control",placeholder:"Enter user's email address"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"phone"}," Phone "),s.a.createElement("input",{type:"text",id:"phone_number",defaultValue:e.edit&&e.user.phone_number||"",onKeyDown:function(e){return function(e){e.persist();if(-1!==[8,37,39].indexOf(e.keyCode)||!(e.currentTarget.value.length>11)&&Number.isInteger(parseInt(e.key))){var t=e.currentTarget.value,a=e.currentTarget,n=e.key;setTimeout((function(){""!=a.value&&0!==t.indexOf("+1")&&(a.value="+1"+n)}),1)}else e.preventDefault()}(e)},onChange:function(t){return e.handleInputChanges(t)},name:"phone_number",className:"form-control",placeholder:"+[d]1234567890"})),s.a.createElement("div",{className:"form-group col-md-4 pull-right"},s.a.createElement("button",{className:"btn btn-success",type:"submit"},e.edit?"Edit User":"Add User"),e.loading&&s.a.createElement("span",{className:"fa fa-circle-o-notch fa-spin"})))},X=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(e){e.preventDefault(),n.setState({loading:!0});var t={Username:n.state.Username,name:n.state.name,email:n.state.email,phone_number:n.state.phone_number};n.setState({submitSuccess:!0,values:[].concat(Object(M.a)(n.state.values),[t]),loading:!1}),n.props.session.isLoggedIn&&L.a.post(B.a.host+B.a.port+"/api/user",t,n.state.headers).then((function(e){return[setTimeout((function(){n.props.history.push("/user")}),1500)]})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}))},n.handleInputChanges=function(e){e.preventDefault(),n.setState(Object(D.a)({},e.currentTarget.name,e.currentTarget.value))},n.returnToIndex=function(e){n.props.history.push("/user")},n.state={Username:"",name:"",email:"",phone_number:"",values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){if(this.props.session.isLoggedIn){var e={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:e})}}},{key:"render",value:function(){var e=this.state,t=e.submitSuccess,a=e.submitFail,s=e.loading,r=e.errorMessage;return n.createElement(V,null,n.createElement(J,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Create User"),!t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Fill the form below to create a new post"),t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"The form was successfully submitted!"),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},r),n.createElement(K,{user:this.state.user,handleInputChanges:this.handleInputChanges,loading:s,processFormSubmission:this.processFormSubmission}))))}}]),a}(n.Component),Y=Object(o.b)((function(e){return{session:e.session}}))(X),Z=function(){return s.a.createElement("div",{className:"spinner fadein"},s.a.createElement(H.a,{icon:W.a,size:"5x",color:"#3B5998"}))},$=function(e){return e.images.map((function(t,a){return s.a.createElement("div",{key:a,className:"fadein"},s.a.createElement("div",{onClick:function(){return e.removeImage(t.public_id)},className:"delete"},s.a.createElement(H.a,{icon:W.d,size:"2x"})),s.a.createElement("img",{className:"preview",src:window.URL.createObjectURL(t),alt:""}))}))},q=function(e){return s.a.createElement("div",{className:"buttons fadein"},s.a.createElement("div",{className:"button"},s.a.createElement("div",null,s.a.createElement("input",{type:"file",id:"single",onChange:e.onChange})," "),s.a.createElement(H.a,{icon:W.b,color:"#3B5998",size:"10x"})))},G=function(e){var t=!0===e.recipe.isPublic?1:0;return s.a.createElement("form",{className:"row",id:"create-post-form",onSubmit:e.processFormSubmission,noValidate:!0},s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"rating"}," What would you rate this Recipe on a scale of 1-10?",s.a.createElement("select",{value:e.recipe.rating,onChange:function(t){return e.handleInputChanges(t)},id:"rating",name:"rating",className:"form-control"},s.a.createElement("option",{value:"1"},"1"),s.a.createElement("option",{value:"2"},"2"),s.a.createElement("option",{value:"3"},"3"),s.a.createElement("option",{value:"4"},"4"),s.a.createElement("option",{value:"5"},"5"),s.a.createElement("option",{value:"6"},"6"),s.a.createElement("option",{value:"7"},"7"),s.a.createElement("option",{value:"8"},"8"),s.a.createElement("option",{value:"9"},"9"),s.a.createElement("option",{value:"10"},"10")))),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"is_public"}," Should this Recipe be Public to ALL logged-in Users?",s.a.createElement("select",{value:t,onChange:function(t){return e.handleInputChanges(t)},id:"is_public",name:"is_public",className:"form-control"},s.a.createElement("option",{value:"0"},"Private"),s.a.createElement("option",{value:"1"},"Public")))),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"first_name"}," Name/Title "),s.a.createElement("input",{type:"text",id:"name",defaultValue:e.recipe.name,onChange:function(t){return e.handleInputChanges(t)},name:"name",className:"form-control",placeholder:"Recipe Title"})),s.a.createElement("div",{className:"form-group col-md-12"},s.a.createElement("label",{htmlFor:"recipe"}," Recipe "),s.a.createElement("textarea",{id:"recipe",defaultValue:e.recipe.recipe,onChange:function(t){return e.handleInputChanges(t)},name:"recipe",className:"form-control",placeholder:"Enter the Recipe Here!!"})),e.children&&s.a.createElement("div",{className:"form-group col-md-12"},e.children),s.a.createElement("div",{className:"form-group col-md-4 pull-right"},s.a.createElement("button",{className:"btn btn-success",type:"submit"},e.edit?"Edit Recipe":"Add Recipe")))},Q=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(e){e.preventDefault(),n.setState({loading:!0});var t=new FormData;t.append("is_public",n.state.is_public),t.append("rating",n.state.rating),t.append("name",n.state.name),t.append("recipe",n.state.recipe),t.append("submitted_by",n.props.session.user.userName),n.state.images.forEach((function(e,a){t.append("photo",e)})),n.setState({submitSuccess:!0,values:[].concat(Object(M.a)(n.state.values),[t]),loading:!1}),n.props.session.isLoggedIn&&n.props.session.isAdmin&&L.a.post(B.a.host+B.a.port+"/api/recipe",t,n.state.headers).then((function(e){return[setTimeout((function(){n.props.history.push("/recipe")}),1500)]})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}))},n.handleInputChanges=function(e){e.preventDefault(),n.setState(Object(D.a)({},e.currentTarget.name,e.currentTarget.value))},n.onChange=function(e){var t=Array.from(e.target.files);n.setState({uploading:!1,images:t})},n.removeImage=function(e){n.setState({images:n.state.images.filter((function(t){return t.public_id!==e}))})},n.returnToIndex=function(e){n.props.history.push("/recipe")},n.state={rating:5,is_public:0,name:"",submitted_by:"",recipe:"",values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,images:[],headers:{}},n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){if(this.props.session.isLoggedIn){var e={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken),"content-type":"multipart/form-data"}};this.setState({headers:e})}else this.props.history.push("/")}},{key:"render",value:function(){var e=this,t=this.state,a=t.submitSuccess,s=t.submitFail,r=t.loading,i=t.errorMessage,o=t.uploading,c=t.images;return n.createElement(V,null,n.createElement(J,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Create Recipe"),!a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Fill the form below to create a new post"),a&&n.createElement("div",{className:"alert alert-info",role:"alert"},"The form was successfully submitted!"),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},i),n.createElement(G,{recipe:this.state.recipe,handleInputChanges:this.handleInputChanges,processFormSubmission:this.processFormSubmission,loading:r},n.createElement("div",null,n.createElement("div",{className:"buttons form-group col-md-12"},function(){switch(!0){case o:return n.createElement(Z,null);case c.length>0:return n.createElement($,{images:c,removeImage:e.removeImage});default:return n.createElement(q,{onChange:e.onChange})}}()))))))}}]),a}(n.Component),ee=Object(o.b)((function(e){return{session:e.session}}))(Q),te=a(32),ae=a(33),ne=a.n(ae),se=a(40),re=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(){var e=Object(se.a)(ne.a.mark((function e(t){return ne.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),n.setState({loading:!0}),L.a.put(B.a.host+B.a.port+"/api/recipe/".concat(n.state.id),n.state.values,n.state.headers).then((function(e){n.setState({submitSuccess:!0,loading:!1}),setTimeout((function(){n.props.history.push("/recipe")}),1500)})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}));case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.setValues=function(e){n.setState({values:Object(te.a)(Object(te.a)({},n.state.values),e)})},n.handleInputChanges=function(e){e.preventDefault(),n.setValues(Object(D.a)({},e.currentTarget.id,e.currentTarget.value))},n.returnToIndex=function(e){n.props.history.push("/recipe")},n.state={id:n.props.match.params.id,recipe:{},values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),L.a.get(B.a.host+B.a.port+"/api/recipe/".concat(this.state.id),t).then((function(t){var a=t.data[0];e.setState({recipe:a})})).catch((function(t){return e.props.history.push("/recipe")}))}}},{key:"render",value:function(){var e=this.state,t=e.submitSuccess,a=e.loading,s=e.submitFail,r=e.errorMessage;return n.createElement(V,null,n.createElement(J,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Edit Recipe"),t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"Recipe details have been edited successfully "),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},r)),n.createElement(G,{recipe:this.state.recipe,loading:a,handleInputChanges:this.handleInputChanges,processFormSubmission:this.processFormSubmission,edit:"true"})),"}")}}]),a}(n.Component),ie=Object(o.b)((function(e){return{session:e.session}}))(re),oe=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).processFormSubmission=function(){var e=Object(se.a)(ne.a.mark((function e(t){return ne.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),n.setState({loading:!0}),L.a.put(B.a.host+B.a.port+"/api/user/".concat(n.state.id),n.state.values,n.state.headers).then((function(e){n.setState({submitSuccess:!0,loading:!1}),setTimeout((function(){n.props.history.push("/user")}),1500)})).catch((function(e){n.setState({submitSuccess:!1,submitFail:!0,errorMessage:e.response.data.message})}));case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.setValues=function(e){n.setState({values:Object(te.a)(Object(te.a)({},n.state.values),e)})},n.handleInputChanges=function(e){e.preventDefault(),n.setValues(Object(D.a)({},e.currentTarget.id,e.currentTarget.value))},n.returnToIndex=function(e){n.props.history.push("/recipe")},n.state={id:n.props.match.params.id,user:{},values:[],loading:!1,submitSuccess:!1,submitFail:!1,errorMessage:null,headers:{}},n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),L.a.get(B.a.host+B.a.port+"/api/user/".concat(this.state.id),t).then((function(t){e.setState({user:t.data})})).catch((function(t){return e.props.history.push("/user")}))}}},{key:"render",value:function(){var e=this.state,t=e.submitSuccess,a=e.loading,s=e.submitFail,r=e.errorMessage;return n.createElement(V,null,this.state.user&&n.createElement(J,{returnToIndex:this.returnToIndex},n.createElement("div",{className:"col-md-12 "},n.createElement("h2",null,"Edit User"),t&&n.createElement("div",{className:"alert alert-info",role:"alert"},"user's details has been edited successfully"),s&&n.createElement("div",{className:"alert alert-info",role:"alert"},r),n.createElement(K,{user:this.state.user,handleInputChanges:this.handleInputChanges,loading:a,processFormSubmission:this.processFormSubmission,edit:"true"}))))}}]),a}(n.Component),ce=Object(o.b)((function(e){return{session:e.session}}))(oe);a(90);var le=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).onSignOut=function(e){e.preventDefault(),R()},n.state={apiStatus:"Not called"},n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){this.props.session.isLoggedIn}},{key:"render",value:function(){return s.a.createElement("div",{className:"Home"},s.a.createElement("header",{className:"background"},s.a.createElement("div",{className:"intro container-fluid"},"Welcome to Bake n' Flake!"),s.a.createElement("img",{className:"Home-logo ",alt:"logo",src:"https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_250_250.png"})))}}]),a}(n.Component),ue=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{}}))(le);var me=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(){return Object(f.a)(this,a),t.apply(this,arguments)}return Object(b.a)(a,[{key:"componentDidMount",value:function(){(this.props.location.hash||this.props.location.search)&&this.props.initSessionFromCallbackURI(window.location.href)}},{key:"render",value:function(){return!this.props.location.hash&&!this.props.location.search||this.props.session.isLoggedIn?s.a.createElement(E.a,{to:"/"}):s.a.createElement("div",null)}}]),a}(n.Component),pe=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{initSessionFromCallbackURI:function(t){return e(C(t))}}}))(me),de=a(14),he=function(e){e.preventDefault(),R()},fe=function(e){return s.a.createElement("nav",{className:"navbar navbar-expand-md navbar-dark"},s.a.createElement("a",{className:"navbar-brand",href:"/"},s.a.createElement("img",{src:"https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_75_75.png",alt:"bake n flake bakery",height:"75",width:"75"})),s.a.createElement("button",{type:"button",className:"navbar-toggler","data-toggle":"collapse","data-target":"#navbarCollapse"},s.a.createElement("span",{className:"navbar-toggler-icon"})),s.a.createElement("div",{className:"collapse navbar-collapse",id:"navbarCollapse"},s.a.createElement("div",{className:"navbar-nav"},e.session.isLoggedIn&&e.session.isAdmin&&s.a.createElement(de.b,{className:"nav-link",to:"/user"},"Users"),e.session.isLoggedIn&&s.a.createElement(de.b,{className:"nav-link",to:"/recipe"},"Recipes")),s.a.createElement("div",{className:"navbar-nav ml-auto"},e.session.isLoggedIn?s.a.createElement("span",null,s.a.createElement("span",{className:"white-txt"},"Hello ",e.session.user.userName,"\xa0\xa0"),s.a.createElement("span",null,s.a.createElement("a",{className:"Home-link",href:"#",onClick:he},"Sign out")," ")):s.a.createElement("a",{className:"Home-link",href:A()},"Sign in"))))},be=a(96),ge=a(97),ve=a(99),Ee=a(101),Ne=function(e){Object(Ee.a)(a,e);var t=Object(ve.a)(a);function a(){return Object(be.a)(this,a),t.apply(this,arguments)}return Object(ge.a)(a,[{key:"componentDidMount",value:function(){}},{key:"render",value:function(){return s.a.createElement("div",{className:"Home"},s.a.createElement("header",{className:"Home-header"},s.a.createElement("p",null,"404 Page Not Found")))}}]),a}(n.Component),ye=Object(o.b)()(Ne),ke=a(100),Se=function(e){var t=e.component,a=(e.roles,e.session),n=Object(ke.a)(e,["component","roles","session"]);return s.a.createElement(E.b,Object.assign({},n,{render:function(e){return a.isLoggedIn?a.isAdmin?s.a.createElement(t,e):s.a.createElement(E.a,{to:{pathname:"/"}}):s.a.createElement(E.a,{to:{pathname:"/",state:{from:e.location}}})}}))},Oe=a(30),je=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(){return Object(f.a)(this,a),t.apply(this,arguments)}return Object(b.a)(a,[{key:"render",value:function(){var e=this;return s.a.createElement("tr",{key:this.props.recipe.id},s.a.createElement("td",null,this.props.recipe.name),s.a.createElement("td",null,this.props.recipe.submitted_by),s.a.createElement("td",null,this.props.recipe.rating),s.a.createElement("td",null,this.props.recipe.isPublic?"No":"Yes"),s.a.createElement("td",null,s.a.createElement("div",{className:"d-flex justify-content-between align-items-center"},s.a.createElement("div",{className:"btn-group",style:{marginBottom:"20px"}},s.a.createElement(de.b,{to:"recipe/".concat(this.props.recipe.id),className:"btn btn-sm btn-success btn-outline-secondary"},"View Recipe "),this.props.isAdmin&&s.a.createElement(de.b,{to:"recipe/edit/".concat(this.props.recipe.id),className:"btn btn-warning btn-sm btn-outline-secondary"},"Edit Recipe "),this.props.isAdmin&&s.a.createElement("button",{type:"button",className:"btn btn-danger btn-sm btn-outline-secondary",onClick:function(){return e.props.deleteRecipe(e.props.recipe.id)}},"Delete Recipe")))))}}]),a}(s.a.Component),Ie=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).state={recipes:[],headers:{},isAdmin:!1},n.deleteRecipe=n.deleteRecipe.bind(Object(Oe.a)(n)),n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){this.setState({isAdmin:this.props.session.isAdmin});var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),L.a.get(B.a.host+B.a.port+"/api/recipe",t).then((function(t){t.data.sort((function(e,t){return e.name>t.name?1:t.name>e.name?-1:0})),e.setState({recipes:t.data})}))}}},{key:"deleteRecipe",value:function(e){var t=this;L.a.delete(B.a.host+B.a.port+"/api/recipe/".concat(e),this.state.headers).then((function(a){var n=t.state.recipes.findIndex((function(t){return t.id===e}));t.state.recipes.splice(n,1),t.props.history.push("/recipe")}))}},{key:"render",value:function(){var e=this,t=this.state.recipes;return s.a.createElement(V,null,s.a.createElement("div",{className:"row"},s.a.createElement("div",{className:"card um-main-body mx-auto"},s.a.createElement("div",{className:"card-block"},s.a.createElement("div",{className:"card-title"},s.a.createElement("strong",null,"Recipes"),this.state.isAdmin&&s.a.createElement(de.b,{to:"recipe/create",className:"btn btn-sm btn-outline-secondary float-right"}," Create New Recipe")),s.a.createElement("div",{className:"card-text"},0===t.length?s.a.createElement("div",{className:"text-center"},s.a.createElement("h2",null,"No recipe found at the moment")):s.a.createElement("div",{className:"table-responsive-md"},s.a.createElement("table",{className:"table table-bordered table-striped"},s.a.createElement("thead",{className:"thead-light"},s.a.createElement("tr",null,s.a.createElement("th",{scope:"col"},"Name"),s.a.createElement("th",{scope:"col"},"Submitted_by"),s.a.createElement("th",{scope:"col"},"Rating"),s.a.createElement("th",{scope:"col"},"Private?"),s.a.createElement("th",{scope:"col"},"Actions"))),s.a.createElement("tbody",null,t&&t.map((function(t){return(e.state.isAdmin||t.isPublic)&&s.a.createElement(je,{recipe:t,deleteRecipe:e.deleteRecipe,isAdmin:e.state.isAdmin,key:t.id})}))))))))))}}]),a}(n.Component),xe=Object(o.b)((function(e){return{session:e.session}}))(Ie),Ce=(a(525),function(e){for(var t=[],a=0;a<e.stars;a++)t.push(s.a.createElement(H.a,{className:"star",icon:W.c,size:"1x",key:a+1}));return t}),we=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).returnToIndex=function(e){n.props.history.push("/recipe")},n.state={recipe:[],headers:{}},n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),L.a.get(B.a.host+B.a.port+"/api/recipe/"+this.props.match.params.id,this.state.headers).then((function(t){!e.props.session.isAdmin&&!t.data[0].isPublic||0===t.data.length?e.props.history.push("/recipe"):e.setState({recipe:t.data[0]})})).catch((function(t){return e.props.history.push("/recipe")}))}this.state.recipe===[]&&this.props.history.push("/recipe")}},{key:"render",value:function(){var e=this.state.recipe,t=null==e.picture?"no_photo.jpg":e.picture;return s.a.createElement(V,null,s.a.createElement(J,{returnToIndex:this.returnToIndex},s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"wrapper row"},s.a.createElement("div",{className:"preview col-md-6"},s.a.createElement("div",{className:"preview-pic tab-content"},s.a.createElement("div",{className:"tab-pane active",id:"pic-1"},s.a.createElement("img",{src:"https://umanage-mowatr.s3.amazonaws.com/"+t,alt:"recipe"})))),s.a.createElement("div",{className:"details col-md-6"},s.a.createElement("h3",{className:"recipe-title"},e.name),s.a.createElement("h5",{className:"submitted-by"},"By ",s.a.createElement("span",null,e.submitted_by)),s.a.createElement("h5",{className:"review-no"},"Rated: ",e.rating,"/10 "),s.a.createElement("div",{className:"rating"},s.a.createElement(Ce,{stars:e.rating})),s.a.createElement("h5",{className:"review-no"},"Recipe:"),s.a.createElement("p",{className:"recipe-description"},e.recipe))))))}}]),a}(n.Component),Te=Object(o.b)((function(e){return{session:e.session}}))(we),Ue=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(){return Object(f.a)(this,a),t.apply(this,arguments)}return Object(b.a)(a,[{key:"render",value:function(){var e=this;return s.a.createElement("tr",{key:this.props.user.Username},s.a.createElement("td",null,this.props.user.Username),s.a.createElement("td",null,this.props.user.name),s.a.createElement("td",null,this.props.user.email),s.a.createElement("td",null,this.props.user.phone_number),s.a.createElement("td",null,s.a.createElement("div",{className:"d-flex justify-content-between align-items-center"},s.a.createElement("div",{className:"btn-group",style:{marginBottom:"20px"}},s.a.createElement(de.b,{to:"user/edit/".concat(this.props.user.Username),className:"btn btn-sm btn-outline-secondary"},"Edit User"),s.a.createElement("button",{className:"btn btn-sm btn-outline-secondary",onClick:function(){return e.props.deleteUser(e.props.user.Username)}},"Delete User")))))}}]),a}(s.a.Component),Fe=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(e){var n;return Object(f.a)(this,a),(n=t.call(this,e)).state={users:[],headers:{}},n.deleteUser=n.deleteUser.bind(Object(Oe.a)(n)),n}return Object(b.a)(a,[{key:"componentDidMount",value:function(){var e=this;if(this.props.session.isLoggedIn){var t={headers:{Authorization:"Bearer ".concat(this.props.session.credentials.accessToken)}};this.setState({headers:t}),L.a.get(B.a.host+B.a.port+"/api/user",t).then((function(t){t.data.sort((function(e,t){return e.Username>t.Username?1:t.Username>e.Username?-1:0})),e.setState({users:t.data})}))}}},{key:"deleteUser",value:function(e){var t=this;L.a.delete(B.a.host+B.a.port+"/api/user/".concat(e),this.state.headers).then((function(a){var n=t.state.users.findIndex((function(t){return t.id===e}));t.state.users.splice(n,1),t.props.history.push("/user")}))}},{key:"render",value:function(){var e=this,t=this.state.users;return s.a.createElement(V,null,s.a.createElement("div",{className:"row mx-auto"},s.a.createElement("div",{className:"card um-main-body mx-auto"},s.a.createElement("div",{className:"card-block"},s.a.createElement("div",{className:"card-title"},s.a.createElement("strong",null,"Users")," ",s.a.createElement(de.b,{to:"user/create",className:"btn btn-sm btn-outline-secondary float-right"}," Create New User")),s.a.createElement("div",{className:"card-text"},0===t.length?s.a.createElement("div",{className:"text-center"},s.a.createElement("h2",null,"No users found at the moment")):s.a.createElement("div",{className:"container"},s.a.createElement("div",{className:"table-responsive-md"},s.a.createElement("table",{className:"table table-bordered table-striped table-responsive"},s.a.createElement("thead",{className:"thead-light"},s.a.createElement("tr",null,s.a.createElement("th",{scope:"col"},"Username"),s.a.createElement("th",{scope:"col"},"Full Name"),s.a.createElement("th",{scope:"col"},"Email"),s.a.createElement("th",{scope:"col"},"Phone"),s.a.createElement("th",{scope:"col"},"Actions"))),s.a.createElement("tbody",null,t&&t.map((function(t){return s.a.createElement(Ue,{user:t,deleteUser:e.deleteUser,key:t.Username})})))))))))))}}]),a}(n.Component),_e=Object(o.b)((function(e){return{session:e.session}}))(Fe);var Ae=function(e){Object(g.a)(a,e);var t=Object(v.a)(a);function a(){return Object(f.a)(this,a),t.apply(this,arguments)}return Object(b.a)(a,[{key:"componentDidMount",value:function(){this.props.initSession()}},{key:"render",value:function(){return n.createElement("div",null,n.createElement(fe,{session:this.props.session}),n.createElement(E.d,null,n.createElement(E.b,{path:"/",exact:!0,component:ue}),n.createElement(E.b,{path:"/login",exact:!0,component:pe}),n.createElement(E.b,{path:"/logout",exact:!0,component:ue}),n.createElement(E.b,{path:"/recipe",exact:!0,component:xe}),n.createElement(Se,{path:"/recipe/edit/:id",exact:!0,component:ie,session:this.props.session}),n.createElement(Se,{path:"/recipe/create",exact:!0,component:ee,session:this.props.session}),n.createElement(E.b,{path:"/recipe/:id",exact:!0,component:Te}),n.createElement(Se,{path:"/user",exact:!0,component:_e,session:this.props.session}),n.createElement(Se,{path:"/user/create",exact:!0,component:Y,session:this.props.session}),n.createElement(Se,{path:"/user/edit/:id",exact:!0,component:ce,session:this.props.session}),n.createElement(E.b,{component:ye})))}}]),a}(n.Component),Re=Object(o.b)((function(e){return{session:e.session}}),(function(e){return{initSession:function(){return e(x())}}}))(Ae);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(s.a.createElement(o.a,{store:h},s.a.createElement(de.a,null,s.a.createElement(Re,null))),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))},90:function(e,t,a){}},[[102,1,2]]]);
//# sourceMappingURL=main.aa0af5dd.chunk.js.map