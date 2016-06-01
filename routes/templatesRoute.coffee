Router.map ->

  @route 'templates',
    path: '/templates'
    waitOn: ->
      Meteor.subscribe 'Template'
      Meteor.subscribe 'FolderQueue'
      Meteor.subscribe 'UserData'
    data: ->
      privateTemplates: Template.find({owner: Meteor.userId()}, {sort: {name: 1}})
      queue: FolderQueue.findOne({}, {sort: {addedAt: -1}})
    onBeforeAction: ->
      sync = Meteor.call("syncProfile")
      Accounts.onLogin(sync)
      @next()

  @route 'managePrivate',
    path: '/manage/private'
    waitOn: ->
      Meteor.subscribe 'Template'
    data: ->
      privateTemplates: Template.find({owner: Meteor.userId()}, {sort: {createdAt: 1}})
    onBeforeAction: ->
      sync = Meteor.call("syncProfile")
      Accounts.onLogin(sync)
      @next()


  @route 'createTemplate',
    path: '/template/create'
    onBeforeAction: ->
      sync = Meteor.call("syncProfile")
      Accounts.onLogin(sync)
      @next()


  @route 'viewTemplate',
    path: '/template/:_id/view'
    waitOn: ->
      Meteor.subscribe 'Template'
    data: ->
      template: Template.findOne({$and: [{_id: this.params._id},{owner: Meteor.userId()}]})
    onBeforeAction: ->
      sync = Meteor.call("syncProfile")
      Accounts.onLogin(sync)
      @next()


  @route 'notFound',
    path: '*'
    layoutTemplate: 'homeLayout'
