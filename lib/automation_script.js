exports['automationScript'] = {
    "facebook.com" : {
        site: "http://www.facebook.com",
        properties: {
            about_me:        
                        {
                        name: 'About me',
                        getter: [
                            {
                                op: 'assert_url',
                                code: "$('a.headerTinymanName').attr('href') + '/info';",
                                wait: {
                                    event: 'ready'
                                }
                            },
                    
                            {
                                op: 'simulate_click',
                                target: "$('#pagelet_bio').find('.profileEditButton')",
                                wait: {
                                    event: 'dom_modified',
                                    selector: '#pagelet_bio',
                                    ntimes: 2
                                }
                            },
                    
                            {
                                op: 'return_value',
                                code: "$('.profileTextareaField').find('.uiMenuItem.checked').attr('data-label')",
                                wait: {
                                    event: 'none'
                                }
                            },
                    
                    
                            {
                                op: 'simulate_click',
                                target: "$('#pagelet_bio').find('.uiHeaderActions > .uiButton')",
                                wait: {
                                    event: 'dom_modified',
                                    selector: '#pagelet_bio',
                                    ntimes: 1
                                }
                            },
                    
                            {
                                op: 'script_finished'
                            }
                    
                        ]
                },
                
                work_education:        
                            {
                            name: 'Education and Work',
                            getter: [
                                {
                                    op: 'assert_url',
                                    code: "$('a.headerTinymanName').attr('href') + '/info';",
                                    wait: {
                                        event: 'ready'
                                    }
                                },
                                    
                                {
                                    op: 'simulate_click',
                                    target: "$('#eduwork').find('.profileEditButton')",
                                    wait: {
                                        event: 'dom_modified',
                                        selector: '#pagelet_eduwork',
                                        ntimes: 2
                                    }
                                },
                                
                                {
                                    op: 'return_value',
                                    code: "$('.profileTextareaField').find('.uiMenuItem.checked').attr('data-label')",
                                    wait: {
                                        event: 'none'
                                    },
                                    timeout: 2000
                                },
                                
                                
                                // {
                                //     op: 'simulate_click',
                                //     target: "$('#pagelet_eduwork').find('.uiHeaderActions > .uiButton')",
                                //     wait: {
                                //         event: 'dom_modified',
                                //         selector: '#pagelet_eduwork',
                                //         ntimes: 1
                                //     },
                                //     timeout: 2000
                                // },
                                // 
                                {
                                    op: 'script_finished'
                                }

                            ]
                    },
                    
                    favorite_quotes:        
                                {
                                name: 'Favorite Quotes',
                                getter: [
                                    {
                                        op: 'assert_url',
                                        code: "$('a.headerTinymanName').attr('href') + '/info';",
                                        wait: {
                                            event: 'ready'
                                        }
                                    },

                                    {
                                        op: 'simulate_click',
                                        target: "$('#pagelet_quotes').find('.profileEditButton')",
                                        wait: {
                                            event: 'dom_modified',
                                            selector: '#pagelet_quotes',
                                            ntimes: 2
                                        }
                                    },

                                    {
                                        op: 'return_value',
                                        code: "$('.profileTextareaField').find('.uiMenuItem.checked').attr('data-label')",
                                        wait: {
                                            event: 'none'
                                        },
                                        timeout: 2000
                                    },


                                    {
                                        op: 'script_finished'
                                    }

                                ]
                        },
                        
                        timeline_privacy:        
                                    {
                                    name: 'Timeline Privacy',
                                    getter: [
                                        {
                                            op: 'assert_url',
                                            url: "'https://www.facebook.com/settings/?tab=privacy'",
                                            wait: {
                                                event: 'ready'
                                            }
                                        },

                                        {
                                            op: 'simulate_click',
                                            target: "$($('.uiListItem:visible')[4]).find('a')",
                                            wait: {
                                                event: 'dom_modified',
                                                selector: '.uiList',
                                                ntimes: 2
                                            }
                                        },

                                        // {
                                        //       op: 'return_value',
                                        //       code: "$('.profileTextareaField').find('.uiMenuItem.checked').attr('data-label')",
                                        //       wait: {
                                        //           event: 'none'
                                        //       },
                                        //       timeout: 2000
                                        //   },
  

                                        {
                                            op: 'script_finished'
                                        }

                                    ]
                            }
        }
    }
};